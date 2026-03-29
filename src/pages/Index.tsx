import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setChecking(false);
      return;
    }

    // User is logged in — check admin role and onboarding status, then redirect
    const checkAndRedirect = async () => {
      const [{ data: roleData }, { data }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any }),
        supabase.from("profiles").select("onboarding_completed").eq("id", user.id).single(),
      ]);

      if (roleData === true) {
        navigate("/admin", { replace: true });
      } else if (data?.onboarding_completed) {
        navigate("/discover", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };

    checkAndRedirect();
  }, [user, loading, navigate]);

  if (loading || (checking && !!user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Landing />
    </>
  );
};

export default Index;
