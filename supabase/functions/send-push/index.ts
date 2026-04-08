import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_PUBLIC_KEY =
      "BEk1S7G1LkzUf3gvf4RdCUEDuIGzA_8E2GSJnQxdwZBMdK_INyo6Ys8bTrOEiLMoO71UGhtgD63foBY7FP7bBv4";

    if (!VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "VAPID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Accept payload from database webhook trigger or direct call
    const body = await req.json();

    // The trigger sends { type, record, ... } — we need the record
    const record = body.record ?? body;
    const userId = record.user_id;
    const title = record.title ?? "New Notification";
    const notifBody = record.body ?? "";
    const type = record.type ?? "general";

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get push subscriptions for this user
    const { data: pushSubs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!pushSubs || pushSubs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build URL based on notification type
    let url = "/notifications";
    if (type === "message" && record.related_match_id) {
      url = `/messages?match=${record.related_match_id}`;
    } else if (type === "match" && record.related_match_id) {
      url = `/messages?match=${record.related_match_id}`;
    } else if (type === "like") {
      url = "/who-liked-me";
    } else if (type === "missed_call" && record.related_match_id) {
      url = `/messages?match=${record.related_match_id}`;
    }

    const { default: webpush } = await import(
      "https://esm.sh/web-push@3.6.7"
    );
    webpush.setVapidDetails(
      "mailto:support@myfilipinomatch.lovable.app",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({ title, body: notifBody, url });

    const results = await Promise.allSettled(
      pushSubs.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 60 }
          )
          .catch(async (err: unknown) => {
            console.warn("Push send failed:", err);
            if (err && typeof err === "object" && "statusCode" in err) {
              const code = (err as { statusCode: number }).statusCode;
              if (code === 410 || code === 404) {
                await supabaseAdmin
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", sub.endpoint);
              }
            }
            throw err;
          })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return new Response(JSON.stringify({ sent, total: pushSubs.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-push error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
