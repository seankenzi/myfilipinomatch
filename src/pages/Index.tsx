import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

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

  // Show landing page immediately — no spinner for unauthenticated visitors
  return (
    <>
      <Navbar bannerSubtitle="See who you're talking to instantly" />
      <Landing />
    </>
  );
};

export default Index;
