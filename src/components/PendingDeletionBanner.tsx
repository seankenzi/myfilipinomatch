import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface PendingDeletion {
  id: string;
  scheduled_for: string;
}

const PendingDeletionBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!user) {
      setPending(null);
      return;
    }
    let cancelled = false;
    const fetchPending = async () => {
      const { data } = await supabase
        .from("account_deletions" as any)
        .select("id, scheduled_for")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setPending(data as any);
    };
    fetchPending();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleRestore = async () => {
    if (!pending) return;
    setRestoring(true);
    try {
      const { error } = await supabase
        .from("account_deletions" as any)
        .update({ status: "cancelled" })
        .eq("id", pending.id);
      if (error) throw error;
      setPending(null);
      toast({
        title: "Account restored 🎉",
        description: "Welcome back — your profile and data are safe.",
      });
    } catch {
      toast({
        title: "Could not restore account",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  if (!pending) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground shadow-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Your account deletion is awaiting admin approval.</strong>{" "}
            Your profile stays active and visible to others until then. Cancel anytime to keep your account.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="haptic-press shrink-0"
          disabled={restoring}
          onClick={handleRestore}
        >
          {restoring ? "Cancelling..." : "Cancel Request"}
        </Button>
      </div>
    </div>
  );
};

export default PendingDeletionBanner;

