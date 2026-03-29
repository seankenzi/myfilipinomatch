import { Crown, Heart, Eye, Zap, MessageCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import visaLogo from "@/assets/visa-logo.svg";
import mastercardLogo from "@/assets/mastercard-logo.svg";
import paypalLogo from "@/assets/paypal-logo.png";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "₱1,699",
    priceSub: "per month",
    period: "/month",
    popular: false,
    features: [
      "Unlimited likes (free users get 10/day)",
      "Unlimited messaging",
      "See who liked you",
      "Undo accidental passes",
      "Profile boost (24h top placement)",
      "Advanced filters (education, height, language & more)",
      "Direct message anyone",
      "Read receipts",
    ],
  },
  {
    id: "quarterly" as const,
    name: "3 Months",
    price: "₱3,899",
    priceSub: "₱1,300/month — save 23%",
    period: "/3 months",
    popular: false,
    features: [
      "Everything in Monthly",
      "Priority in Discover",
      "Exclusive badge",
      "Priority support",
    ],
  },
  {
    id: "yearly" as const,
    name: "1 Year",
    price: "₱11,999",
    priceSub: "Only ₱1,000/month — save 41%",
    period: "/year",
    popular: true,
    features: [
      "All Premium features included",
      "Best value — biggest savings",
      "VIP badge on your profile",
      "Priority support & early access to new features",
    ],
  },
];

const Premium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_premium) setIsPremium(true);
      });

    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCurrentPlan(data.plan);
      });
  }, [user]);

  const handleSubscribe = async (plan: "monthly" | "quarterly" | "yearly") => {
    if (!user) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }

    setLoading(plan);
    try {
      const res = await supabase.functions.invoke("create-checkout", {
        body: {
          plan,
          success_url: `${window.location.origin}/premium?success=true`,
          cancel_url: `${window.location.origin}/premium?cancelled=true`,
        },
      });

      if (res.error) throw new Error(res.error.message);

      const { checkout_url, order_id } = res.data;
      
      // Store order_id for capture on return
      if (order_id) {
        sessionStorage.setItem("paypal_order_id", order_id);
      }

      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Unable to start checkout",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Handle PayPal return — capture order on success
  const captureAttempted = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("success") === "true" && !captureAttempted.current) {
      captureAttempted.current = true;
      const orderId = sessionStorage.getItem("paypal_order_id");
      
      if (orderId) {
        sessionStorage.removeItem("paypal_order_id");
        // Capture the PayPal payment
        supabase.functions.invoke("paypal-capture", {
          body: { order_id: orderId },
        }).then(({ data, error }) => {
          if (error || !data?.success) {
            console.error("Capture failed:", error || data);
            toast({
              title: "Payment processing issue",
              description: "Your payment may still be processing. Please check back shortly.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Payment successful! 🎉",
              description: "Your premium subscription is now active. Enjoy unlimited access!",
            });
            setIsPremium(true);
            setCurrentPlan(data.plan);
          }
        });
      } else {
        toast({
          title: "Payment successful! 🎉",
          description: "Your premium subscription is now active. Enjoy unlimited access!",
        });
      }
      window.history.replaceState({}, "", "/premium");
    } else if (params.get("cancelled") === "true") {
      toast({
        title: "Payment cancelled",
        description: "No worries — you can upgrade anytime.",
      });
      window.history.replaceState({}, "", "/premium");
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          {/* Hero */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
              <Crown className="h-4 w-4" />
              MyFilipinoMatch Premium
            </div>
            <h1
              className="text-3xl font-bold md:text-4xl mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Unlock the Full Experience
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Get unlimited messaging, see who liked you, and boost your profile to find your match faster.
            </p>
          </div>

          {/* Premium active state */}
          {isPremium && (
            <div className="mb-8 rounded-2xl border-2 border-accent bg-accent/5 p-6 text-center">
              <Crown className="h-8 w-8 text-accent mx-auto mb-2" />
              <h2 className="text-lg font-bold text-foreground">You're a Premium member!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current plan: <span className="font-semibold capitalize">{currentPlan || "Premium"}</span>
              </p>
            </div>
          )}

          {/* Plans */}
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card p-6 shadow-card text-left transition-all hover:shadow-card-hover ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-hero px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-5">{plan.priceSub}</p>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full gap-2"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null || (isPremium && currentPlan === plan.id)}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : isPremium && currentPlan === plan.id ? (
                    "Current Plan"
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      {isPremium ? "Switch Plan" : "Get " + plan.name}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-3">Secure payments via PayPal</p>
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={paypalLogo} alt="PayPal" className="h-6 object-contain" loading="lazy" width={24} height={24} />
                <span className="text-sm font-medium text-foreground">PayPal</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={visaLogo} alt="Visa" className="h-6 w-6 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-foreground">Visa</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
                <img src={mastercardLogo} alt="Mastercard" className="h-6 w-6 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-foreground">Mastercard</span>
              </span>
            </div>
          </div>

          {/* Benefits grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3 text-center">
            {[
              { icon: MessageCircle, title: "Unlimited Messages", desc: "Chat without limits" },
              { icon: Eye, title: "See Who Likes You", desc: "No more guessing" },
              { icon: Zap, title: "Profile Boost", desc: "Get seen 5x more" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Premium;
