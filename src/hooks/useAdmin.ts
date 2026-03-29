import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setIsAdmin(false);
      setResolvedUserId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setResolvedUserId(null);

    const checkAdmin = async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (cancelled) return;

      setIsAdmin(!error && data === true);
      setResolvedUserId(user.id);
      setLoading(false);
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isLoadingCurrentUser = useMemo(() => {
    if (!user) return loading;
    return loading || resolvedUserId !== user.id;
  }, [loading, resolvedUserId, user]);

  return { isAdmin, loading: isLoadingCurrentUser };
};
