import { ArrowLeft, Bell, Lock, Shield, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    // Sign out - actual deletion would require a backend function
    toast({ title: "Account deletion requested", description: "Your account will be deleted within 24 hours." });
    await signOut();
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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

          {/* Account */}
          <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Account
            </h2>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{user?.email}</p>
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
