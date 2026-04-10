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

    // Define reminder windows: each window targets users who signed up
    // within a specific time range and haven't completed onboarding yet.
    const windows = [
      {
        label: "24-48h",
        fromHours: 48,
        toHours: 24,
        keySuffix: "",           // original key for backward compat
        templateSuffix: "",
      },
      {
        label: "48-72h",
        fromHours: 72,
        toHours: 48,
        keySuffix: "-2",
        templateSuffix: "",
      },
      {
        label: "72-96h",
        fromHours: 96,
        toHours: 72,
        keySuffix: "-3",
        templateSuffix: "",
      },
    ];

    let totalSent = 0;

    for (const window of windows) {
      const olderBound = new Date(Date.now() - window.fromHours * 60 * 60 * 1000).toISOString();
      const newerBound = new Date(Date.now() - window.toHours * 60 * 60 * 1000).toISOString();

      const { data: incompleteUsers, error: queryError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("onboarding_completed", false)
        .lt("created_at", newerBound)
        .gt("created_at", olderBound);

      if (queryError) throw queryError;
      if (!incompleteUsers || incompleteUsers.length === 0) continue;

      for (const user of incompleteUsers) {
        if (!user.email) continue;

        const idempotencyKey = `onboarding-reminder${window.keySuffix}-${user.id}`;

        // Check if this specific reminder was already sent
        const { data: existingLog } = await supabase
          .from("email_send_log")
          .select("id")
          .eq("recipient_email", user.email)
          .eq("template_name", "onboarding-reminder")
          .like("metadata->>idempotency_key", idempotencyKey)
          .limit(1);

        if (existingLog && existingLog.length > 0) continue;

        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "onboarding-reminder",
            recipientEmail: user.email,
            idempotencyKey,
            templateData: {
              name: user.full_name?.split(" ")[0] || undefined,
              reminderNumber: window.keySuffix === "" ? 1 : window.keySuffix === "-2" ? 2 : 3,
            },
          },
        });

        totalSent++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${totalSent} onboarding reminders`, count: totalSent }),
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
