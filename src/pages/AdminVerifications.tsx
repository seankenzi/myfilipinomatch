import { useState, useEffect } from "react";
import {
  Shield, CheckCircle, XCircle, Clock, ArrowLeft, Eye, Camera, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getSignedPhotoUrl, getSignedPhotoUrls } from "@/lib/storage";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

interface VerificationRecord {
  id: string;
  user_id: string;
  type: string;
  document_url: string | null;
  status: string | null;
  created_at: string;
  reviewed_at: string | null;
  pose_instruction: string | null;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    photos: string[] | null;
    signedPhotos?: string[];
    email: string | null;
  };
}

const AdminVerifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [compareRecord, setCompareRecord] = useState<VerificationRecord | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const fetchRecords = async () => {
    setLoading(true);
    let query = supabase
      .from("verifications")
      .select("*")
      .eq("type", "photo")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error loading verifications", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setRecords([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for each user
    const userIds = [...new Set(data.map((v) => v.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, photos, email")
      .in("id", userIds);

    // Resolve signed URLs for profile photos and document URLs
    const resolvedProfiles = await Promise.all(
      (profiles || []).map(async (p) => {
        const avatar = p.avatar_url ? await getSignedPhotoUrl(p.avatar_url) : null;
        const signedPhotos = p.photos?.length ? await getSignedPhotoUrls(p.photos) : [];
        return { ...p, avatar_url: avatar, signedPhotos };
      })
    );
    const profileMap = new Map(resolvedProfiles.map((p) => [p.id, p]));

    const enriched: VerificationRecord[] = await Promise.all(
      data.map(async (v) => ({
        ...v,
        document_url: v.document_url ? await getSignedPhotoUrl(v.document_url) : null,
        profile: profileMap.get(v.user_id) || undefined,
      }))
    );

    setRecords(enriched);
    setLoading(false);
  };

  const handleAction = async (id: string, userId: string, action: "approved" | "rejected") => {
    setProcessing(id);

    const { error: updateError } = await supabase
      .from("verifications")
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      setProcessing(null);
      return;
    }

    if (action === "approved") {
      await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", userId);
    }

    toast({
      title: action === "approved" ? "Verification approved ✅" : "Verification rejected",
      description: action === "approved" ? "User now has a verified badge." : "User has been notified.",
    });

    setProcessing(null);
    setCompareRecord(null);
    fetchRecords();
  };

  const statusColors: Record<string, string> = {
    pending: "text-accent",
    approved: "text-secondary",
    rejected: "text-destructive",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => navigate("/profile")}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Verification Review
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve user photo verifications
            </p>
          </div>

          {/* Filter tabs */}
          <div className="mb-6 flex gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
              <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} verifications found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card flex items-center gap-4"
                >
                  {/* Verification photo thumbnail */}
                  {record.document_url ? (
                    <button
                      onClick={() => setCompareRecord(record)}
                      className="relative flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border border-border hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={record.document_url}
                        alt="Verification"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
                        <Eye className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {record.profile?.full_name || "Unknown User"}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${statusColors[record.status || "pending"]}`}>
                        {statusIcons[record.status || "pending"]}
                        {record.status || "pending"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {record.profile?.email || "No email"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Submitted {format(new Date(record.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {/* Compare + Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCompareRecord(record)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Compare
                    </Button>
                    {record.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleAction(record.id, record.user_id, "rejected")}
                          disabled={processing === record.id}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          onClick={() => handleAction(record.id, record.user_id, "approved")}
                          disabled={processing === record.id}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Side-by-Side Comparison Dialog */}
      <Dialog open={!!compareRecord} onOpenChange={() => setCompareRecord(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Verify: {compareRecord?.profile?.full_name || "Unknown User"}
              <span className={`flex items-center gap-1 text-xs font-normal ${statusColors[compareRecord?.status || "pending"]}`}>
                {statusIcons[compareRecord?.status || "pending"]}
                {compareRecord?.status || "pending"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Left: Verification selfie */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                Verification Selfie
              </p>
              {compareRecord?.document_url ? (
                <img
                  src={compareRecord.document_url}
                  alt="Verification selfie"
                  className="w-full rounded-xl border border-border"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-xl bg-muted border border-border">
                  <Camera className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Submitted {compareRecord ? format(new Date(compareRecord.created_at), "MMM d, yyyy 'at' h:mm a") : ""}
              </p>
            </div>

            {/* Right: Profile photos */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Profile Photos
              </p>
              {compareRecord?.profile?.signedPhotos?.length ? (
                <div className="space-y-2">
                  {compareRecord.profile.signedPhotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Profile photo ${i + 1}`}
                      className="w-full rounded-xl border border-border"
                    />
                  ))}
                </div>
              ) : compareRecord?.profile?.avatar_url ? (
                <img
                  src={compareRecord.profile.avatar_url}
                  alt="Profile avatar"
                  className="w-full rounded-xl border border-border"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-xl bg-muted border border-border">
                  <User className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground ml-2">No profile photos</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions in dialog */}
          {compareRecord?.status === "pending" && (
            <div className="flex justify-end gap-3 pt-2 border-t border-border mt-2">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => compareRecord && handleAction(compareRecord.id, compareRecord.user_id, "rejected")}
                disabled={processing === compareRecord?.id}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
              <Button
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => compareRecord && handleAction(compareRecord.id, compareRecord.user_id, "approved")}
                disabled={processing === compareRecord?.id}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Approve
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;
