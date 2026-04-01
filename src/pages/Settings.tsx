import { ArrowLeft, Lock, Trash2, Mail, Crown, Video, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [subscription, setSubscription] = useState<{
    plan: string | null;
    status: string | null;
    current_period_end: string | null;
  } | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [videoUsedSeconds, setVideoUsedSeconds] = useState(0);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [exportingData, setExportingData] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription(data);
      setLoadingSub(false);
    };
    const fetchVideoUsage = async () => {
      if (!user) return;
      const { data, error } = await supabase.rpc("get_monthly_video_usage", { p_user_id: user.id });
      if (!error && data !== null) setVideoUsedSeconds(data as number);
      setLoadingVideo(false);
    };
    fetchSubscription();
    fetchVideoUsage();
  }, [user]);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully!" });
      setNewPassword("");
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = confirm(
      "Are you sure you want to delete your account? All your data will be permanently removed within 24 hours. This cannot be undone."
    );
    if (!confirmed) return;

    try {
      // Create a pending deletion record
      const { error } = await supabase.from("account_deletions" as any).insert({
        user_id: user.id,
      });
      if (error) throw error;

      toast({
        title: "Account deletion scheduled",
        description: "Your account and all data will be permanently deleted within 24 hours.",
      });
      await signOut();
      navigate("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to schedule deletion. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const isActive = subscription?.status === "active";
  const isPremium = subscription?.plan && subscription.plan !== "free";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>

          {/* Subscription */}
          <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Subscription
            </h2>
            {loadingSub ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground">Current Plan</Label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-medium capitalize">
                        {isPremium ? subscription.plan : "Free"}
                      </p>
                      <Badge variant={isActive && isPremium ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {isActive && isPremium ? "Active" : "Free"}
                      </Badge>
                    </div>
                  </div>
                  {!isPremium && (
                    <Button size="sm" onClick={() => navigate("/premium")}>
                      Upgrade
                    </Button>
                  )}
                </div>
                {isPremium && subscription?.current_period_end && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Renews On</Label>
                    <p className="text-sm font-medium">
                      {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Call Usage — only show for yearly subscribers */}
          {subscription?.plan === "yearly" && subscription?.status === "active" && (
            <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-4 font-semibold flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Video Call Usage
              </h2>
              {loadingVideo ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Used this month</span>
                    <span className="font-medium">
                      {Math.floor(videoUsedSeconds / 60)}m / 120m
                    </span>
                  </div>
                  <Progress value={Math.min(100, (videoUsedSeconds / 7200) * 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {videoUsedSeconds >= 7200
                      ? "Monthly limit reached — resets next month."
                      : `${Math.floor((7200 - videoUsedSeconds) / 60)} minutes remaining`}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Account
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Current Email</Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-xs">Change Email</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    disabled={changingEmail}
                    onClick={async () => {
                      if (!newEmail || !newEmail.includes("@")) {
                        toast({ title: "Please enter a valid email", variant: "destructive" });
                        return;
                      }
                      setChangingEmail(true);
                      const { error } = await supabase.auth.updateUser({ email: newEmail });
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Confirmation sent", description: "Check both your old and new email to confirm the change." });
                        setNewEmail("");
                      }
                      setChangingEmail(false);
                    }}
                  >
                    {changingEmail ? "..." : "Update"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">You'll need to confirm via both your old and new email.</p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Security
            </h2>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">New Password</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? "..." : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Privacy & Data
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download a copy of all personal data we hold about you.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={exportingData}
              onClick={async () => {
                setExportingData(true);
                try {
                  const { data, error } = await supabase.functions.invoke("export-user-data");
                  if (error) throw error;
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: "Data exported successfully!" });
                } catch {
                  toast({ title: "Export failed", description: "Please try again later.", variant: "destructive" });
                } finally {
                  setExportingData(false);
                }
              }}
            >
              {exportingData ? "Exporting..." : "Download My Data"}
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-destructive/30 bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data.
            </p>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Settings;
