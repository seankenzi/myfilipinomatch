import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

async function getCallerUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS);
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const callerId = await getCallerUserId(req);
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify caller is admin
    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = body?.user_id as string | undefined;
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userId === callerId) {
      return new Response(JSON.stringify({ error: "Admins cannot delete their own account here" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Snapshot for the deletion log
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    // Cascade-delete user data
    const deletions = [
      admin.from("video_call_signals").delete().or(`caller_id.eq.${userId},callee_id.eq.${userId}`),
      admin.from("video_call_sessions").delete().eq("user_id", userId),
      admin.from("messages").delete().eq("sender_id", userId),
      admin.from("notifications").delete().eq("user_id", userId),
      admin.from("notifications").delete().eq("related_user_id", userId),
      admin.from("likes").delete().or(`liker_id.eq.${userId},liked_id.eq.${userId}`),
      admin.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      admin.from("reports").delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`),
      admin.from("verifications").delete().eq("user_id", userId),
      admin.from("contact_submissions").delete().eq("user_id", userId),
      admin.from("profile_boosts").delete().eq("user_id", userId),
      admin.from("subscriptions").delete().eq("user_id", userId),
      admin.from("feature_flags").delete().eq("user_id", userId),
      admin.from("cookie_consents").delete().eq("user_id", userId),
      admin.from("crash_logs").delete().eq("user_id", userId),
      admin.from("push_subscriptions").delete().eq("user_id", userId),
    ];
    await Promise.all(deletions);

    // Matches + their messages
    const { data: userMatches } = await admin
      .from("matches")
      .select("id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (userMatches && userMatches.length > 0) {
      const matchIds = userMatches.map((m) => m.id);
      await admin.from("messages").delete().in("match_id", matchIds);
      await admin.from("matches").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    }

    // DM conversations + messages
    const { data: dmConvos } = await admin
      .from("dm_conversations")
      .select("id")
      .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`);
    if (dmConvos && dmConvos.length > 0) {
      const ids = dmConvos.map((c) => c.id);
      await admin.from("dm_messages").delete().in("conversation_id", ids);
      await admin.from("dm_conversations").delete().in("id", ids);
    }

    // Roles + profile
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

    // Storage: profile photos
    try {
      const { data: files } = await admin.storage.from("profile-photos").list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await admin.storage.from("profile-photos").remove(paths);
      }
    } catch (e) {
      console.warn("storage cleanup failed", e);
    }

    // Auth user
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("auth delete failed", authError);
      return new Response(JSON.stringify({ error: `Auth delete failed: ${authError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log to account_deletions for audit. If the user already had a pending
    // self-requested deletion, mark THAT row completed instead of inserting a
    // duplicate so the admin dashboard shows a single clean audit entry.
    const { data: existingPending } = await admin
      .from("account_deletions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPending?.id) {
      await admin
        .from("account_deletions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          user_email: targetProfile?.email ?? null,
          user_full_name: targetProfile?.full_name ?? null,
        })
        .eq("id", existingPending.id);
    } else {
      await admin.from("account_deletions").insert({
        user_id: userId,
        user_email: targetProfile?.email ?? null,
        user_full_name: targetProfile?.full_name ?? null,
        status: "completed",
        scheduled_for: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }


    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-delete-user error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
