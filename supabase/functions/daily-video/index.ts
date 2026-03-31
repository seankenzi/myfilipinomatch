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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle end-session action
    if (action === "end-session") {
      const parsed = EndSessionSchema.safeParse(await req.json());
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { session_id, duration_seconds } = parsed.data;

      const { error: updateError } = await supabaseAdmin
        .from("video_call_sessions")
        .update({
          ended_at: new Date().toISOString(),
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

    if (existingRoom.ok) {
      const roomData = await existingRoom.json();
      roomUrl = roomData.url;
    } else {
      const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            exp: Math.floor(Date.now() / 1000) + roomExpSeconds,
            max_participants: 2,
            enable_chat: false,
            enable_screenshare: false,
          },
        }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text();
        throw new Error(`Daily API room creation failed [${createRes.status}]: ${errBody}`);
      }

      const roomData = await createRes.json();
      roomUrl = roomData.url;
    }

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
          user_name: user.id,
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

    const fullRoomUrl = `${roomUrl}?t=${tokenData.token}`;

    await supabaseAdmin
      .from("video_call_signals")
      .insert({
        match_id,
        caller_id: user.id,
        callee_id: calleeId,
        room_url: fullRoomUrl,
        status: "ringing",
      });

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
