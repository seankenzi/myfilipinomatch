import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

type UnsubState = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<UnsubState>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("already");
        } else if (data.valid) {
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch {
        setState("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) {
        setState("error");
      } else if (data?.success) {
        setState("success");
      } else if (data?.reason === "already_unsubscribed") {
        setState("already");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
    setProcessing(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card text-center">
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}

          {state === "valid" && (
            <>
              <MailX className="mx-auto h-10 w-10 text-primary mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Unsubscribe from emails
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                You will no longer receive app emails from MyFilipinoMatch.
                Authentication emails (password resets, etc.) will still be sent.
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                className="w-full"
                style={{ backgroundColor: "#d4456a" }}
              >
                {processing ? "Processing…" : "Confirm Unsubscribe"}
              </Button>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                You've been unsubscribed
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                You won't receive any more app emails from us.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </>
          )}

          {state === "already" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Already unsubscribed
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                This email address has already been unsubscribed.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </>
          )}

          {state === "invalid" && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Invalid link
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                This unsubscribe link is invalid or has expired.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
              <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                We couldn't process your request. Please try again later.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Unsubscribe;
