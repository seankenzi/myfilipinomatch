import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkOnboardingStatus = async () => {
      if (loading) return;

      if (!user || !session) {
        if (!cancelled) {
          setOnboardingComplete(null);
          setCheckingOnboarding(false);
        }
        return;
      }

      setCheckingOnboarding(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (error) {
        setCheckingOnboarding(true);
        return;
      }

      setOnboardingComplete(!!data?.onboarding_completed);
      setCheckingOnboarding(false);
    };

    checkOnboardingStatus();

    return () => {
      cancelled = true;
    };
  }, [user, session, loading]);

  if (loading || checkingOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !session) return <Navigate to="/login" replace />;
  if (onboardingComplete === false) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
