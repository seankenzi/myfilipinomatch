import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to gather all user data
    const adminClient = createClient(supabaseUrl, supabaseKey);
    const userId = user.id;

    const [
      { data: profile },
      { data: likes },
      { data: matches },
      { data: messages },
      { data: notifications },
      { data: reports },
      { data: verifications },
      { data: blockedUsers },
      { data: contactSubmissions },
      { data: videoSessions },
    ] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", userId).single(),
      adminClient.from("likes").select("*").or(`liker_id.eq.${userId},liked_id.eq.${userId}`),
      adminClient.from("matches").select("*").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      adminClient.from("messages").select("*").eq("sender_id", userId),
      adminClient.from("notifications").select("*").eq("user_id", userId),
      adminClient.from("reports").select("*").eq("reporter_id", userId),
      adminClient.from("verifications").select("*").eq("user_id", userId),
      adminClient.from("blocked_users").select("*").eq("blocker_id", userId),
      adminClient.from("contact_submissions").select("*").eq("user_id", userId),
      adminClient.from("video_call_sessions").select("*").eq("user_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_email: user.email,
      profile,
      likes: likes || [],
      matches: matches || [],
      messages_sent: messages || [],
      notifications: notifications || [],
      reports_filed: reports || [],
      verifications: verifications || [],
      blocked_users: blockedUsers || [],
      contact_submissions: contactSubmissions || [],
      video_call_sessions: videoSessions || [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="my-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: "Failed to export data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
