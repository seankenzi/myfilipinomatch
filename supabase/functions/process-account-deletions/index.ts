// Auto-processing of account deletions has been DISABLED.
// Account deletion requests now require explicit admin approval via the
// admin dashboard (which calls the `admin-delete-user` edge function).
// This function is intentionally a no-op and is left in place so any
// previously-scheduled cron invocations do nothing.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({
      message:
        "Auto-processing disabled. Account deletions now require explicit admin approval from the admin dashboard.",
      processed: 0,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
