import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find users who signed up 24-48 hours ago and haven't completed onboarding
    // and haven't already received a reminder
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: incompleteUsers, error: queryError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("onboarding_completed", false)
      .lt("created_at", twentyFourHoursAgo)
      .gt("created_at", fortyEightHoursAgo);

    if (queryError) throw queryError;

    if (!incompleteUsers || incompleteUsers.length === 0) {
      return new Response(JSON.stringify({ message: "No users to remind", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const user of incompleteUsers) {
      if (!user.email) continue;

      // Check if reminder was already sent (via email_send_log)
      const { data: existingLog } = await supabase
        .from("email_send_log")
        .select("id")
        .eq("recipient_email", user.email)
        .eq("template_name", "onboarding-reminder")
        .limit(1);

      if (existingLog && existingLog.length > 0) continue;

      // Send reminder email
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "onboarding-reminder",
          recipientEmail: user.email,
          idempotencyKey: `onboarding-reminder-${user.id}`,
          templateData: {
            name: user.full_name?.split(" ")[0] || undefined,
          },
        },
      });

      sentCount++;
    }

    return new Response(
      JSON.stringify({ message: `Sent ${sentCount} onboarding reminders`, count: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in onboarding-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
