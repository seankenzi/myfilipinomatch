import { useState, useEffect } from "react";
import { Zap, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COOLDOWN_DAYS = 7;

interface ProfileBoostButtonProps {
  userId: string | undefined;
}

const ProfileBoostButton = ({ userId }: ProfileBoostButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [activeBoost, setActiveBoost] = useState<{ expires_at: string } | null>(null);
  const [lastBoost, setLastBoost] = useState<{ created_at: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchBoostStatus();
  }, [userId]);

  const fetchBoostStatus = async () => {
    if (!userId) return;
    setLoading(true);

    // Check for active boost
    const { data: active } = await supabase
      .from("profile_boosts")
      .select("expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check for most recent boost (for cooldown)
    const { data: recent } = await supabase
      .from("profile_boosts")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveBoost(active);
    setLastBoost(recent);
    setLoading(false);
  };

  const activateBoost = async () => {
    if (!userId) return;
    setBoosting(true);

    const { error } = await supabase
      .from("profile_boosts")
      .insert({ user_id: userId });

    if (error) {
      toast({ title: "Boost failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Boosted! 🚀", description: "Your profile will appear at the top of Discover for 24 hours." });
      await fetchBoostStatus();
    }
    setBoosting(false);
  };

  if (loading) return null;

  // Active boost — show countdown
  if (activeBoost) {
    const expiresAt = new Date(activeBoost.expires_at);
    const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

    return (
      <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-card text-center">
        <div className="flex items-center justify-center gap-2 text-primary font-semibold mb-1">
          <Zap className="h-4 w-4 fill-primary" />
          Profile Boosted!
        </div>
        <p className="text-sm text-muted-foreground">
          Your profile is at the top of Discover — {hoursLeft}h remaining
        </p>
      </div>
    );
  }

  // Cooldown check
  if (lastBoost) {
    const lastBoostDate = new Date(lastBoost.created_at);
    const cooldownEnd = new Date(lastBoostDate.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now < cooldownEnd) {
      const daysLeft = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium mb-1">
            <Clock className="h-4 w-4" />
            Boost on Cooldown
          </div>
          <p className="text-sm text-muted-foreground">
            Available again in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
  }

  // Ready to boost
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card text-center">
      <p className="text-sm text-muted-foreground mb-3">
        Boost your profile to appear at the top of Discover for 24 hours
      </p>
      <Button
        onClick={activateBoost}
        disabled={boosting}
        className="gradient-hero text-primary-foreground gap-2"
      >
        {boosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        Activate Boost
      </Button>
    </div>
  );
};

export default ProfileBoostButton;
