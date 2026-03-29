import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  plan: z.enum(["monthly", "quarterly", "yearly"]),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

const PLANS: Record<string, { name: string; amount: string; description: string }> = {
  monthly: {
    name: "MyFilipinoMatch Premium — Monthly",
    amount: "29.99",
    description: "Unlimited messaging, see who liked you, profile boost",
  },
  quarterly: {
    name: "MyFilipinoMatch Premium — 3 Months",
    amount: "69.99",
    description: "Best value — everything in Premium for 3 months, save 22%",
  },
  yearly: {
    name: "MyFilipinoMatch Premium — 1 Year",
    amount: "219.99",
    description: "Biggest savings — only $18.33/month, includes 2hrs free video calls/month",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_SECRET_KEY = Deno.env.get("PAYPAL_SECRET_KEY");
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
      throw new Error("PayPal credentials are not configured");
    }

    // Verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plan, success_url, cancel_url } = parsed.data;
    const planConfig = PLANS[plan];

    // Get PayPal access token
    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(PAYPAL_CLIENT_ID + ":" + PAYPAL_SECRET_KEY)}`,
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("PayPal token error:", JSON.stringify(tokenData));
      throw new Error("Failed to obtain PayPal access token");
    }

    const accessToken = tokenData.access_token;

    // Create PayPal order
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${user.id}_${plan}`,
            description: planConfig.description,
            amount: {
              currency_code: "USD",
              value: planConfig.amount,
              breakdown: {
                item_total: { currency_code: "USD", value: planConfig.amount },
              },
            },
            items: [
              {
                name: planConfig.name,
                quantity: "1",
                unit_amount: { currency_code: "USD", value: planConfig.amount },
                category: "DIGITAL_GOODS",
              },
            ],
            custom_id: JSON.stringify({ user_id: user.id, plan }),
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              brand_name: "MyFilipinoMatch",
              locale: "en-PH",
              landing_page: "LOGIN",
              user_action: "PAY_NOW",
              return_url: success_url,
              cancel_url: cancel_url,
            },
          },
        },
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      console.error("PayPal order error:", JSON.stringify(orderData));
      throw new Error(`PayPal API error [${orderRes.status}]: ${JSON.stringify(orderData)}`);
    }

    // Find the approval link
    const approveLink = orderData.links?.find(
      (l: { rel: string; href: string }) => l.rel === "payer-action"
    );

    if (!approveLink) {
      throw new Error("No PayPal approval URL returned");
    }

    return new Response(
      JSON.stringify({ checkout_url: approveLink.href, order_id: orderData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
