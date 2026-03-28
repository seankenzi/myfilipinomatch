import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();
    const event = body?.data?.attributes;

    if (!event) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = event.type;
    console.log("PayMongo webhook event:", eventType);

    // We care about checkout_session.payment.paid
    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutData = event.data;
    const metadata = checkoutData?.attributes?.metadata;

    if (!metadata?.user_id || !metadata?.plan) {
      console.error("Missing metadata in webhook:", JSON.stringify(checkoutData));
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = metadata.user_id;
    const plan = metadata.plan;
    const paymentId = checkoutData?.attributes?.payments?.[0]?.id || null;

    // Use service role to update DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Calculate period end (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Upsert subscription
    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        stripe_subscription_id: paymentId, // reusing column for PayMongo payment ID
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) {
      console.error("Error upserting subscription:", subError);
    }

    // Update profile premium status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    console.log(`Subscription activated for user ${userId}, plan: ${plan}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
