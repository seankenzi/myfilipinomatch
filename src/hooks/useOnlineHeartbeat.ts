import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 60_000; // 1 minute

export const useOnlineHeartbeat = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateLastSeen = () => {
      supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", user.id)
        .then();
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [user]);
};
