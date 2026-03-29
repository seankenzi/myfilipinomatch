import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFeatureFlag = (featureName: string) => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEnabled(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("user_id", user.id)
        .eq("feature_name", featureName)
        .maybeSingle();

      if (error || !data) {
        setEnabled(null); // no flag set = default behavior
      } else {
        setEnabled(data.enabled);
      }
      setLoading(false);
    };

    check();
  }, [user, featureName]);

  return { enabled, loading };
};
