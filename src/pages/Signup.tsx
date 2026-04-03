import { useState, useRef, useEffect, useCallback } from "react";
import SEO from "@/components/SEO";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, Heart, Users, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/myfilipinomatch-logo.png";

const TURNSTILE_SITE_KEY = "0x4AAAAAACy2sfcdM2WdoPnF";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getWindow = () => window as any;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users away from Signup
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/discover", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Don't render the signup page (and its <title>) while auth is loading or user is logged in
  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderWidget = useCallback(() => {
    if (turnstileRef.current && getWindow().turnstile && !widgetIdRef.current) {
      widgetIdRef.current = getWindow().turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
        theme: "light",
      });
    }
  }, []);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (document.querySelector('script[src*="turnstile"]')) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => renderWidget();
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && getWindow().turnstile) {
        getWindow().turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
    setGoogleLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast({ title: "Please complete the CAPTCHA", description: "Verify you're human before signing up.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Verify turnstile token server-side
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-turnstile", {
        body: { token: turnstileToken },
      });

      if (verifyError || !verifyData?.success) {
        toast({ title: "CAPTCHA verification failed", description: "Please try again.", variant: "destructive" });
        // Reset widget
        if (widgetIdRef.current && getWindow().turnstile) {
          getWindow().turnstile.reset(widgetIdRef.current);
        }
        setTurnstileToken(null);
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, "");
      if (error) {
        const isDuplicate = error.message.includes("already exists");
        toast({
          title: "Signup failed",
          description: isDuplicate ? (
            <span>
              An account with this email already exists.{" "}
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }} className="font-medium underline">
                Sign in instead
              </a>
            </span>
          ) : error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
        navigate("/login");
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    }

    // Reset widget after attempt
    if (widgetIdRef.current && getWindow().turnstile) {
      getWindow().turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken(null);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-8 md:py-12 bg-background">
      <SEO title="Sign Up Free" description="Create your free MyFilipinoMatch account and start meeting verified Filipino singles looking for serious relationships." canonical="/signup" />
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo & Header */}
        <div className="mb-6 md:mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src={logo} alt="MyFilipinoMatch" className="h-10 w-10" />
            <span className="text-2xl font-display font-bold">MyFilipinoMatch</span>
          </Link>
          <h1 className="text-2xl font-bold font-display">Find Your Filipino Match</h1>
          <p className="mt-2 text-muted-foreground">Takes less than 30 seconds to get started</p>
        </div>

        {/* Trust Badges */}
        <div className="mb-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-secondary" /> No fake accounts</span>
          <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-secondary" /> Your info is safe</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="pl-10 pr-12 h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Turnstile CAPTCHA */}
          <div className="flex justify-center">
            <div ref={turnstileRef} />
          </div>

          {/* Terms & Privacy consent */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms-consent"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms-consent" className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">Terms of Service</Link> and{" "}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
            </Label>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full min-h-[48px] text-base" disabled={loading || !turnstileToken || !agreedToTerms}>
            {loading ? "Creating account..." : "Create Free Account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2 min-h-[48px] text-base"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Signing up..." : "Continue with Google"}
        </Button>

        {/* Social Proof */}
        <div className="mt-5 rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-primary fill-primary" />
              <span className="font-medium text-foreground">Serious relationships only</span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-secondary" />
              <span>100% reviewed profiles</span>
            </div>
          </div>
        </div>


        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Already have an account?</p>
          <Button variant="outline" size="lg" className="w-full min-h-[48px] border-primary/30 text-primary hover:bg-primary/10" asChild>
            <Link to="/login">Sign in to your account</Link>
          </Button>
        </div>
        <p className="mt-3 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
