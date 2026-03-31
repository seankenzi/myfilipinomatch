import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const EmailUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEO title="Unsubscribe | MyFilipinoMatch" description="Manage your email preferences" />
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">Email Preferences</h1>

        {status === "loading" && (
          <p className="text-muted-foreground">Verifying your request...</p>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Click below to unsubscribe from app notification emails from MyFilipinoMatch.
            </p>
            <Button onClick={handleUnsubscribe} variant="destructive" className="w-full">
              Confirm Unsubscribe
            </Button>
          </div>
        )}

        {status === "success" && (
          <p className="text-muted-foreground">
            You've been unsubscribed. You will no longer receive app notification emails.
          </p>
        )}

        {status === "already_unsubscribed" && (
          <p className="text-muted-foreground">
            You've already been unsubscribed from these emails.
          </p>
        )}

        {status === "invalid" && (
          <p className="text-destructive">
            This unsubscribe link is invalid or has expired.
          </p>
        )}

        {status === "error" && (
          <p className="text-destructive">
            Something went wrong. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailUnsubscribe;
