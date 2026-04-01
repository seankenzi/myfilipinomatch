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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Find all pending deletions whose scheduled time has passed
    const { data: pendingDeletions, error: fetchError } = await admin
      .from("account_deletions")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching pending deletions:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch deletions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingDeletions || pendingDeletions.length === 0) {
      return new Response(JSON.stringify({ message: "No pending deletions", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const deletion of pendingDeletions) {
      const userId = deletion.user_id;
      console.log(`Processing deletion for user: ${userId}`);

      try {
        // Delete user data from all tables in order (respecting foreign keys)
        const deletions = [
          admin.from("video_call_signals").delete().or(`caller_id.eq.${userId},callee_id.eq.${userId}`),
          admin.from("video_call_sessions").delete().eq("user_id", userId),
          admin.from("messages").delete().eq("sender_id", userId),
          admin.from("notifications").delete().eq("user_id", userId),
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
        ];
        await Promise.all(deletions);

        // Delete matches (user could be user1 or user2)
        // First get match IDs to also clean up messages in those matches
        const { data: userMatches } = await admin
          .from("matches")
          .select("id")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (userMatches && userMatches.length > 0) {
          const matchIds = userMatches.map((m) => m.id);
          // Delete all messages in those matches
          await admin.from("messages").delete().in("match_id", matchIds);
          // Delete the matches
          await admin.from("matches").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        }

        // Delete user roles
        await admin.from("user_roles").delete().eq("user_id", userId);

        // Delete profile
        await admin.from("profiles").delete().eq("id", userId);

        // Delete user photos from storage
        const { data: files } = await admin.storage.from("photos").list(userId);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${userId}/${f.name}`);
          await admin.storage.from("photos").remove(paths);
        }

        // Delete the auth user (this is permanent)
        const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          console.error(`Failed to delete auth user ${userId}:`, authDeleteError);
          throw authDeleteError;
        }

        // Mark deletion as completed
        await admin.from("account_deletions").update({
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", deletion.id);

        results.push({ userId, success: true });
        console.log(`Successfully deleted all data for user: ${userId}`);
      } catch (err) {
        console.error(`Error deleting user ${userId}:`, err);
        results.push({ userId, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${results.length} deletion(s)`,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process deletions error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
