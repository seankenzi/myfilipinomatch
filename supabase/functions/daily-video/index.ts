import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DAILY_API_URL = "https://api.daily.co/v1";
const MONTHLY_LIMIT_SECONDS = 2 * 60 * 60; // 2 hours in seconds

const BodySchema = z.object({
  match_id: z.string().uuid(),
});

const EndSessionSchema = z.object({
  session_id: z.string().uuid(),
  duration_seconds: z.number().int().min(0),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      throw new Error("DAILY_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolveDisplayName = async () => {
      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const emailFallback = user.email?.split("@")[0]?.trim() ?? "";
      const fallbackName = metadataName || emailFallback || "Member";

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Failed to load profile name for Daily token:", profileError.message);
        return fallbackName;
      }

      const profileName =
        typeof profile?.full_name === "string" ? profile.full_name.trim() : "";

      return profileName || fallbackName;
    };

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle join action – callee gets their own unique meeting token
    if (action === "join") {
      const JoinSchema = z.object({ match_id: z.string().uuid() });
      const joinParsed = JoinSchema.safeParse(await req.json());
      if (!joinParsed.success) {
        return new Response(
          JSON.stringify({ error: joinParsed.error.flatten().fieldErrors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { match_id: joinMatchId } = joinParsed.data;

      // Verify user is part of this match
      const { data: joinMatch } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id")
        .eq("id", joinMatchId)
        .single();

      if (!joinMatch || (joinMatch.user1_id !== user.id && joinMatch.user2_id !== user.id)) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const joinRoomName = `match-${joinMatchId}`;

      // Get the existing room to confirm it exists
      const roomCheck = await fetch(`${DAILY_API_URL}/rooms/${joinRoomName}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });

      if (!roomCheck.ok) {
        return new Response(JSON.stringify({ error: "Room not found – the call may have ended" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const roomInfo = await roomCheck.json();
      const displayName = await resolveDisplayName();

      // Create a unique meeting token for the callee
      const calleeTokenRes = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
         properties: {
            room_name: joinRoomName,
            user_name: displayName,
            exp: Math.floor(Date.now() / 1000) + 3600,
            is_owner: false,
          },
        }),
      });

      if (!calleeTokenRes.ok) {
        const errBody = await calleeTokenRes.text();
        throw new Error(`Daily token creation failed: ${errBody}`);
      }

      const calleeTokenData = await calleeTokenRes.json();

      return new Response(
        JSON.stringify({
          room_url: roomInfo.url,
          token: calleeTokenData.token,
          full_room_url: `${roomInfo.url}?t=${calleeTokenData.token}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle end-session action
    if (action === "end-session") {
      const parsed = EndSessionSchema.safeParse(await req.json());
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let { session_id, duration_seconds } = parsed.data;

      const { data: existingSession, error: sessionLookupError } = await supabaseAdmin
        .from("video_call_sessions")
        .select("started_at, ended_at")
        .eq("id", session_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (sessionLookupError) {
        console.error("Error loading session before ending:", sessionLookupError);
        return new Response(JSON.stringify({ error: "Failed to load session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!existingSession?.started_at) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Keep the first ended_at we ever recorded (if already ended)
      const finalizedEndedAt = existingSession.ended_at ?? new Date().toISOString();

      const actualSeconds = Math.max(
        0,
        Math.floor(
          (new Date(finalizedEndedAt).getTime() - new Date(existingSession.started_at).getTime()) /
            1000
        )
      );

      // Safety cap: duration can never exceed 2 hours (7200s)
      if (duration_seconds > 7200) {
        duration_seconds = 7200;
      }

      // Guard against corrupted client values (e.g. unix timestamp treated as duration)
      // Allow up to 2 minutes drift between client-reported duration and DB timestamps.
      const maxReasonableSeconds = Math.min(7200, actualSeconds + 120);
      duration_seconds = Math.max(0, Math.min(duration_seconds, maxReasonableSeconds));

      const { error: updateError } = await supabaseAdmin
        .from("video_call_sessions")
        .update({
          ended_at: finalizedEndedAt,
          duration_seconds,
        })
        .eq("id", session_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error ending session:", updateError);
        return new Response(JSON.stringify({ error: "Failed to end session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default action: start a video call
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { match_id } = parsed.data;

    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id")
      .eq("id", match_id)
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized for this match" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check yearly subscription OR video_calls feature flag
    const [{ data: sub }, { data: featureFlag }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("plan", "yearly")
        .maybeSingle(),
      supabase
        .from("feature_flags")
        .select("enabled")
        .eq("user_id", user.id)
        .eq("feature_name", "video_calls")
        .eq("enabled", true)
        .maybeSingle(),
    ]);

    const hasYearly = sub && sub.current_period_end && new Date(sub.current_period_end) > new Date();
    const hasFeatureFlag = featureFlag?.enabled === true;

    if (!hasYearly && !hasFeatureFlag) {
      return new Response(
        JSON.stringify({ error: "Video calls require a 1-year membership" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check monthly usage limit
    const { data: usageData, error: usageError } = await supabaseAdmin
      .rpc("get_monthly_video_usage", { p_user_id: user.id });

    const usedSeconds = usageError ? 0 : (usageData ?? 0);
    const remainingSeconds = Math.max(0, MONTHLY_LIMIT_SECONDS - usedSeconds);

    if (remainingSeconds <= 0) {
      return new Response(
        JSON.stringify({
          error: "Monthly video call limit reached (2 hours). Resets next month.",
          code: "MONTHLY_LIMIT_REACHED",
          used_seconds: usedSeconds,
          limit_seconds: MONTHLY_LIMIT_SECONDS,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or get a Daily room for this match
    const roomName = `match-${match_id}`;

    // Cap room expiry to remaining time
    const roomExpSeconds = Math.min(remainingSeconds, 3600);

    // Try to get existing room
    const existingRoom = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });

    let roomUrl: string;

    const roomProps = {
      exp: Math.floor(Date.now() / 1000) + roomExpSeconds,
      max_participants: 2,
      enable_chat: false,
      enable_screenshare: false,
      enable_advanced_chat: false,
      enable_video_processing_ui: false,
      enable_network_ui: false,
      sfu_switchover: 0.5,
      geo: "nearest",
    };

    if (existingRoom.ok) {
      const roomData = await existingRoom.json();
      roomUrl = roomData.url;

      // Update existing room to ensure latest properties are applied
      await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties: roomProps }),
      });
    } else {
      const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: roomName, properties: roomProps }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text();
        throw new Error(`Daily API room creation failed [${createRes.status}]: ${errBody}`);
      }

      const roomData = await createRes.json();
      roomUrl = roomData.url;
    }

    const displayName = await resolveDisplayName();

    // Create a meeting token for this user
    const tokenRes = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
       body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: displayName,
          exp: Math.floor(Date.now() / 1000) + roomExpSeconds,
          is_owner: false,
        },
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Daily API token creation failed [${tokenRes.status}]: ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    const fullRoomUrl = `${roomUrl}?t=${tokenData.token}`;

    // Record session start
    const { data: session } = await supabaseAdmin
      .from("video_call_sessions")
      .insert({
        user_id: user.id,
        match_id: match_id,
      })
      .select("id")
      .single();

    // Create or refresh a ringing signal for the other participant
    const calleeId = match.user1_id === user.id ? match.user2_id : match.user1_id;

    await supabaseAdmin
      .from("video_call_signals")
      .delete()
      .eq("match_id", match_id)
      .in("status", ["ringing", "missed", "declined", "ended"]);

    await supabaseAdmin
      .from("video_call_signals")
      .insert({
        match_id,
        caller_id: user.id,
        callee_id: calleeId,
        room_url: roomUrl,
        status: "ringing",
      });

    // Send web push notification to the callee
    try {
      const { data: pushSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", calleeId);

      if (pushSubs && pushSubs.length > 0) {
        const callerName = await resolveDisplayName();
        const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
        const VAPID_PUBLIC_KEY = "BEk1S7G1LkzUf3gvf4RdCUEDuIGzA_8E2GSJnQxdwZBMdK_INyo6Ys8bTrOEiLMoO71UGhtgD63foBY7FP7bBv4";

        if (VAPID_PRIVATE_KEY) {
          // Dynamic import web-push compatible library for Deno
          const { default: webpush } = await import("https://esm.sh/web-push@3.6.7");
          webpush.setVapidDetails(
            "mailto:support@myfilipinomatch.lovable.app",
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
          );

          const payload = JSON.stringify({
            title: "Incoming Video Call 📞",
            body: `${callerName} is calling you!`,
            url: `/messages?match=${match_id}&openVideo=1`,
          });

          await Promise.allSettled(
            pushSubs.map((sub) =>
              webpush
                .sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload,
                  { TTL: 30 }
                )
                .catch((err: unknown) => {
                  console.warn("Push send failed:", err);
                  // Remove invalid subscriptions (410 Gone or 404)
                  if (err && typeof err === "object" && "statusCode" in err) {
                    const code = (err as { statusCode: number }).statusCode;
                    if (code === 410 || code === 404) {
                      supabaseAdmin
                        .from("push_subscriptions")
                        .delete()
                        .eq("endpoint", sub.endpoint)
                        .then(() => {});
                    }
                  }
                })
            )
          );
        }
      }
    } catch (pushErr) {
      console.warn("Push notification error (non-fatal):", pushErr);
    }

    return new Response(
      JSON.stringify({
        room_url: roomUrl,
        token: tokenData.token,
        full_room_url: fullRoomUrl,
        session_id: session?.id,
        remaining_seconds: remainingSeconds,
        used_seconds: usedSeconds,
        limit_seconds: MONTHLY_LIMIT_SECONDS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in daily-video:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
