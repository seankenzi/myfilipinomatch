import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Heart, MessageSquare, Shield, CreditCard, TrendingUp,
  BarChart3, ArrowLeft, Search, Ban, CheckCircle, XCircle,
  Clock, Eye, Star, AlertTriangle, RefreshCw, ToggleLeft, ToggleRight,
  Plus, Trash2, Bug, Video, Mail, Inbox, ExternalLink, Monitor, Smartphone, Tablet, Globe, Activity, Flag, UserMinus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getSignedPhotoUrl } from "@/lib/storage";
import Navbar from "@/components/Navbar";

// ─── Dashboard Tab ───
const DashboardTab = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    verifiedUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    pendingVerifications: 0,
    pendingReports: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, matches, messages, verifications, reports, subscriptions] = await Promise.all([
        supabase.from("profiles").select("id, is_premium, is_verified", { count: "exact", head: false }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("verifications").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("reports").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("subscriptions").select("id", { count: "exact" }).eq("status", "active"),
      ]);

      setStats({
        totalUsers: profiles.data?.length || 0,
        premiumUsers: profiles.data?.filter(p => p.is_premium).length || 0,
        verifiedUsers: profiles.data?.filter(p => p.is_verified).length || 0,
        totalMatches: matches.count || 0,
        totalMessages: messages.count || 0,
        pendingVerifications: verifications.data?.length || 0,
        pendingReports: reports.data?.length || 0,
        activeSubscriptions: subscriptions.data?.length || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Premium Users", value: stats.premiumUsers, icon: Star, color: "text-accent" },
    { label: "Verified Users", value: stats.verifiedUsers, icon: CheckCircle, color: "text-secondary" },
    { label: "Total Matches", value: stats.totalMatches, icon: Heart, color: "text-primary" },
    { label: "Total Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-secondary" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-accent" },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: Shield, color: "text-accent" },
    { label: "Pending Reports", value: stats.pendingReports, icon: AlertTriangle, color: "text-destructive" },
  ];


  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isVerification = card.label === "Pending Verifications";
        const Wrapper = isVerification ? "button" : "div";
        return (
          <Wrapper
            key={card.label}
            className={`rounded-2xl border border-border bg-card p-5 shadow-sm text-left ${
              isVerification ? "cursor-pointer hover:border-primary/50 transition-colors" : ""
            }`}
            {...(isVerification ? { onClick: () => navigate("/admin/verifications") } : {})}
          >
            <div className="flex items-center gap-3 mb-3">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              {isVerification && <Eye className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
          </Wrapper>
        );
      })}
    </div>
  );
};

// ─── Users Tab ───
const UsersTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [onboardingFilter, setOnboardingFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (onboardingFilter === "completed") {
      query = query.eq("onboarding_completed", true);
    } else if (onboardingFilter === "incomplete") {
      query = query.or("onboarding_completed.is.null,onboarding_completed.eq.false");
    }
    const { data } = await query;
    // Resolve signed URLs for avatars
    const usersWithSignedUrls = await Promise.all(
      (data || []).map(async (u: any) => {
        if (u.avatar_url) {
          const signedUrl = await getSignedPhotoUrl(u.avatar_url);
          return { ...u, avatar_url: signedUrl };
        }
        return u;
      })
    );
    setUsers(usersWithSignedUrls);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [onboardingFilter, search]);

  const handleVerify = async (userId: string, verified: boolean) => {
    await supabase.from("profiles").update({ is_verified: verified }).eq("id", userId);
    toast({ title: verified ? "User verified ✅" : "Verification removed" });
    fetchUsers();
  };

  const handleFlag = async (userId: string, userName: string) => {
    const reason = window.prompt(`Flag ${userName || "this user"} for admin review. Enter a reason:`);
    if (!reason || !reason.trim()) return;

    const { error } = await supabase.rpc("admin_flag_user", {
      target_user_id: userId,
      reason: reason.trim(),
    });
    if (error) {
      toast({ title: "Could not flag user", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "User flagged 🚩", description: "Visible in the Flagged tab." });
  };

  const handlePremium = async (userId: string, premium: boolean) => {
    const timestamp = new Date().toISOString();
    const periodEnd = premium ? new Date(Date.now() + 365 * 86400000).toISOString() : null;

    const { data: existingSubs, error: existingError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (existingError) {
      toast({ title: `Could not load subscription record: ${existingError.message}`, variant: "destructive" });
      return;
    }

    const latestSub = existingSubs?.[0] ?? null;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_premium: premium })
      .eq("id", userId);

    if (profileError) {
      toast({ title: `Could not update premium status: ${profileError.message}`, variant: "destructive" });
      return;
    }

    const subscriptionPayload = {
      plan: premium ? "yearly" : "free",
      status: premium ? "active" : "canceled",
      current_period_end: periodEnd,
      updated_at: timestamp,
    };

    const { error: subscriptionError } = latestSub
      ? await supabase
          .from("subscriptions")
          .update(subscriptionPayload)
          .eq("id", latestSub.id)
      : await supabase.from("subscriptions").insert({
          user_id: userId,
          ...subscriptionPayload,
        });

    if (subscriptionError) {
      await supabase.from("profiles").update({ is_premium: !premium }).eq("id", userId);
      toast({ title: `Could not sync subscription: ${subscriptionError.message}`, variant: "destructive" });
      fetchUsers();
      return;
    }

    toast({ title: premium ? "Premium granted ⭐" : "Premium removed" });
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "completed", "incomplete"] as const).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={onboardingFilter === filter ? "default" : "outline"}
              onClick={() => setOnboardingFilter(filter)}
              className="text-xs capitalize"
            >
              {filter === "all" ? "All" : filter === "completed" ? "Onboarded" : "Not Onboarded"}
            </Button>
          ))}
        </div>
        <Button onClick={fetchUsers} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                   <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                   <th className="text-center p-3 font-medium text-muted-foreground">Verified</th>
                   <th className="text-center p-3 font-medium text-muted-foreground">Premium</th>
                   <th className="text-center p-3 font-medium text-muted-foreground">Step</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Last Active</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.open(`/profile/${u.id}`, '_blank')}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {u.avatar_url ? <img src={u.avatar_url} alt={`${u.full_name || 'User'} avatar`} loading="lazy" className="h-full w-full object-cover" /> : <Users className="h-full w-full p-1.5 text-muted-foreground" />}
                        </div>
                        <span className="font-medium truncate max-w-[150px]">{u.full_name || "—"}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">{u.email || "—"}</td>
                    <td className="p-3 text-center">
                      {u.is_verified ? <CheckCircle className="h-4 w-4 text-secondary mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {u.is_premium ? <Star className="h-4 w-4 text-accent mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                    </td>
                     <td className="p-3 text-center">
                       {u.onboarding_completed ? (
                         <span className="text-xs text-secondary font-medium">✓ Done</span>
                       ) : u.onboarding_step > 0 ? (
                         <span className="text-xs text-accent font-medium">{u.onboarding_step}/8</span>
                       ) : (
                         <span className="text-xs text-muted-foreground/40">0/8</span>
                       )}
                     </td>
                      <td className="p-3 text-muted-foreground text-xs">{format(new Date(u.created_at), "MMM d, yyyy")}</td>
                      <td className="p-3 text-muted-foreground text-xs">{u.last_seen ? format(new Date(u.last_seen), "MMM d, yyyy hh:mm a") : "Never"}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleVerify(u.id, !u.is_verified)}>
                          {u.is_verified ? "Unverify" : "Verify"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handlePremium(u.id, !u.is_premium)}>
                          {u.is_premium ? "Remove Premium" : "Grant Premium"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleFlag(u.id, u.full_name)}>
                          <Flag className="h-3 w-3 mr-1" /> Flag
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Moderation Tab ───
const ModerationTab = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [pastVerifications, setPastVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string; pose?: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [reportsRes, verificationsRes, pastVerificationsRes] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("verifications").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
      supabase.from("verifications").select("*").in("status", ["approved", "rejected"]).order("reviewed_at", { ascending: false }).limit(100),
    ]);

    // Enrich with profile names
    const allUserIds = [
      ...new Set([
        ...(reportsRes.data || []).flatMap(r => [r.reporter_id, r.reported_id]),
        ...(verificationsRes.data || []).map(v => v.user_id),
        ...(pastVerificationsRes.data || []).map(v => v.user_id),
      ])
    ];

    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", allUserIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setReports((reportsRes.data || []).map(r => ({
      ...r,
      reporter_name: profileMap.get(r.reporter_id)?.full_name || "Unknown",
      reported_name: profileMap.get(r.reported_id)?.full_name || "Unknown",
    })));

    const enrichedVerifications = await Promise.all(
      (verificationsRes.data || []).map(async (v: any) => {
        let signedDocUrl = v.document_url;
        if (v.document_url) {
          signedDocUrl = await getSignedPhotoUrl(v.document_url);
        }
        return {
          ...v,
          user_name: profileMap.get(v.user_id)?.full_name || "Unknown",
          document_url: signedDocUrl,
        };
      })
    );
    setVerifications(enrichedVerifications);

    const enrichedPast = await Promise.all(
      (pastVerificationsRes.data || []).map(async (v: any) => {
        let signedDocUrl = v.document_url;
        if (v.document_url) {
          signedDocUrl = await getSignedPhotoUrl(v.document_url);
        }
        return {
          ...v,
          user_name: profileMap.get(v.user_id)?.full_name || "Unknown",
          document_url: signedDocUrl,
        };
      })
    );
    setPastVerifications(enrichedPast);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleReport = async (id: string, status: string) => {
    await supabase.from("reports").update({ status }).eq("id", id);
    toast({ title: `Report ${status}` });
    fetchData();
  };

  const handleVerification = async (id: string, userId: string, action: "approved" | "rejected") => {
    await supabase.from("verifications").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (action === "approved") {
      await supabase.from("profiles").update({ is_verified: true }).eq("id", userId);
    }
    toast({ title: action === "approved" ? "Verification approved ✅" : "Verification rejected" });
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-8">
      {/* Pending Verifications */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-secondary" /> Pending Verifications ({verifications.length})</h3>
        {verifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending verifications.</p>
        ) : (
          <div className="space-y-2">
            {verifications.map(v => (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                {v.document_url && (
                  <button onClick={() => setPreviewImage({ url: v.document_url, name: v.user_name, pose: v.pose_instruction })} className="shrink-0">
                    <img src={v.document_url} alt={`Verification document for ${v.user_name}`} loading="lazy" className="h-14 w-14 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity" />
                  </button>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{v.user_name}</p>
                  <p className="text-xs text-muted-foreground">Type: {v.type} · {format(new Date(v.created_at), "MMM d, yyyy")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => handleVerification(v.id, v.user_id, "rejected")}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => handleVerification(v.id, v.user_id, "approved")}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Reports ({reports.length})</h3>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports.</p>
        ) : (
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm"><span className="font-medium">{r.reporter_name}</span> reported <span className="font-medium">{r.reported_name}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Reason: {r.reason}</p>
                    {r.details && <p className="text-xs text-muted-foreground mt-0.5">{r.details}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.created_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === "pending" ? "bg-accent/10 text-accent" :
                      r.status === "resolved" ? "bg-secondary/10 text-secondary" :
                      "bg-destructive/10 text-destructive"
                    }`}>{r.status}</span>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleReport(r.id, "resolved")}>Resolve</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleReport(r.id, "dismissed")}>Dismiss</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification History */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-lg font-semibold mb-3 flex items-center gap-2 hover:text-primary transition-colors"
        >
          <CheckCircle className="h-5 w-5 text-secondary" /> Verification History ({pastVerifications.length})
          <span className="text-xs text-muted-foreground ml-1">{showHistory ? "▲ Hide" : "▼ Show"}</span>
        </button>
        {showHistory && (
          pastVerifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past verifications.</p>
          ) : (
            <div className="space-y-2">
              {pastVerifications.map(v => (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                  {v.document_url && (
                    <button onClick={() => setPreviewImage({ url: v.document_url, name: v.user_name, pose: v.pose_instruction })} className="shrink-0">
                      <img src={v.document_url} alt={`Verification document for ${v.user_name}`} loading="lazy" className="h-14 w-14 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity" />
                    </button>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{v.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Type: {v.type} · Submitted {format(new Date(v.created_at), "MMM d, yyyy")}
                      {v.reviewed_at && ` · Reviewed ${format(new Date(v.reviewed_at), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    v.status === "approved" ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"
                  }`}>
                    {v.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full mx-4 rounded-2xl bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground z-10"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <img
              src={previewImage.url}
              alt={`Verification photo for ${previewImage.name}`}
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
            <div className="mt-3 text-center">
              <p className="font-medium text-foreground">{previewImage.name}</p>
              {previewImage.pose && (
                <p className="text-sm text-muted-foreground mt-1">
                  Pose instruction: <span className="font-medium text-foreground">{previewImage.pose}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Subscriptions Tab ───
const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "monthly", label: "Monthly ($29.99)" },
  { value: "3-month", label: "3-Month ($69.99)" },
  { value: "yearly", label: "Annual ($219.99)" },
];

const SubscriptionsTab = ({ refreshKey }: { refreshKey: number }) => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [saving, setSaving] = useState(false);

  const fetchSubs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      setSubs([]);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      setSubs(data.map(s => ({
        ...s,
        user_name: profileMap.get(s.user_id)?.full_name || "Unknown",
        user_email: profileMap.get(s.user_id)?.email || "—",
      })));
    } else {
      setSubs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubs(); }, [refreshKey]);

  const searchUsers = async (term: string) => {
    if (!term.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, email")
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`).limit(5);
    setSearchResults(data || []);
  };

  const assignPlan = async () => {
    if (!selectedUser) {
      toast({ title: "Select a user first", variant: "destructive" });
      return;
    }
    setSaving(true);

    const isPremium = selectedPlan !== "free";
    const periodEnd = isPremium
      ? new Date(Date.now() + (selectedPlan === "monthly" ? 30 : selectedPlan === "3-month" ? 90 : 365) * 86400000).toISOString()
      : null;

    // Check if subscription exists
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", selectedUser.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("subscriptions").update({
        plan: selectedPlan,
        status: isPremium ? "active" : "canceled",
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
      if (error) {
        toast({ title: `Error: ${error.message}`, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: selectedUser.id,
        plan: selectedPlan,
        status: isPremium ? "active" : "canceled",
        current_period_end: periodEnd,
      });
      if (error) {
        toast({ title: `Error: ${error.message}`, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    // Sync is_premium on profiles
    await supabase.from("profiles").update({ is_premium: isPremium }).eq("id", selectedUser.id);

    toast({ title: `Plan set to "${selectedPlan}" for ${selectedUser.name || selectedUser.email} ✅` });
    setSelectedUser(null);
    setSearch("");
    setSearchResults([]);
    setSaving(false);
    fetchSubs();
  };

  const removeSub = async (subId: string, userId: string) => {
    await supabase.from("subscriptions").update({
      plan: "free",
      status: "canceled",
      current_period_end: null,
      updated_at: new Date().toISOString(),
    }).eq("id", subId);
    await supabase.from("profiles").update({ is_premium: false }).eq("id", userId);
    toast({ title: "Subscription removed" });
    fetchSubs();
  };

  return (
    <div className="space-y-6">
      {/* Plan Switcher */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Assign Subscription Plan</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }}
              className="pl-9"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                    onClick={() => {
                      setSelectedUser({ id: u.id, name: u.full_name || "", email: u.email || "" });
                      setSearch(u.full_name || u.email);
                      setSearchResults([]);
                    }}
                  >
                    <span className="font-medium">{u.full_name || "—"}</span>
                    <span className="text-muted-foreground text-xs">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <Button onClick={assignPlan} size="sm" className="h-10" disabled={saving || !selectedUser}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Assign
          </Button>
        </div>
        {selectedUser && (
          <p className="text-xs text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selectedUser.name || selectedUser.email}</span>
          </p>
        )}
      </div>

      {/* Subscriptions list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : subs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p>No subscriptions yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Expires</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{s.user_name}</p>
                      <p className="text-xs text-muted-foreground">{s.user_email}</p>
                    </td>
                    <td className="p-3 capitalize">{s.plan || "—"}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.status === "active" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                      }`}>{s.status}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {s.current_period_end ? format(new Date(s.current_period_end), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{format(new Date(s.created_at), "MMM d, yyyy")}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeSub(s.id, s.user_id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Feature Flags Tab ───
const COMMON_FEATURES = ["video_calls", "profile_boost", "unlimited_likes", "unlimited_messages", "who_liked_you", "undo_pass"];

const FeatureFlagsTab = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<string>(COMMON_FEATURES[0]);
  const [users, setUsers] = useState<any[]>([]);

  const fetchFlags = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(f => f.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setFlags(data.map(f => ({
        ...f,
        user_name: profileMap.get(f.user_id)?.full_name || "Unknown",
        user_email: profileMap.get(f.user_id)?.email || "—",
      })));
    } else {
      setFlags([]);
    }
    setLoading(false);
  };

  const searchUsers = async (term: string) => {
    if (!term.trim()) { setUsers([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, email")
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`).limit(5);
    setUsers(data || []);
  };

  useEffect(() => { fetchFlags(); }, []);

  const toggleFlag = async (id: string, currentEnabled: boolean) => {
    await supabase.from("feature_flags").update({ enabled: !currentEnabled, updated_at: new Date().toISOString() }).eq("id", id);
    toast({ title: `Feature flag ${!currentEnabled ? "enabled" : "disabled"}` });
    fetchFlags();
  };

  const deleteFlag = async (id: string) => {
    await supabase.from("feature_flags").delete().eq("id", id);
    toast({ title: "Feature flag removed" });
    fetchFlags();
  };

  const addFlag = async () => {
    if (!selectedUser || !selectedFeature) {
      toast({ title: "Select a user and feature", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("feature_flags").insert({
      user_id: selectedUser,
      feature_name: selectedFeature,
      enabled: true,
    });
    if (error) {
      toast({ title: error.message.includes("duplicate") ? "Flag already exists for this user" : error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Feature flag added ✅" });
    setSelectedUser("");
    setSearch("");
    setUsers([]);
    fetchFlags();
  };

  return (
    <div className="space-y-6">
      {/* Add new flag */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Feature Flag</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }}
              className="pl-9"
            />
            {users.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {users.map(u => (
                  <button
                    key={u.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                    onClick={() => { setSelectedUser(u.id); setSearch(u.full_name || u.email); setUsers([]); }}
                  >
                    <span className="font-medium">{u.full_name || "—"}</span>
                    <span className="text-muted-foreground text-xs">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {COMMON_FEATURES.map(f => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}
          </select>
          <Button onClick={addFlag} size="sm" className="h-10">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Flags list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : flags.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <ToggleLeft className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p>No feature flags configured yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Feature</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Updated</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flags.map(f => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{f.user_name}</p>
                      <p className="text-xs text-muted-foreground">{f.user_email}</p>
                    </td>
                    <td className="p-3">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{f.feature_name}</span>
                    </td>
                    <td className="p-3 text-center">
                      {f.enabled
                        ? <ToggleRight className="h-5 w-5 text-secondary mx-auto" />
                        : <ToggleLeft className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                      }
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{format(new Date(f.updated_at), "MMM d, yyyy")}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleFlag(f.id, f.enabled)}>
                          {f.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteFlag(f.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Crash Logs Tab ───
const CrashLogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crash_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Bug className="h-5 w-5 text-destructive" /> Crash Logs ({logs.length})</h3>
        <Button onClick={fetchLogs} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No crashes recorded. 🎉</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-destructive break-all">{log.error_message}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              {log.page_url && (
                <p className="text-xs text-muted-foreground">Page: {log.page_url}</p>
              )}
              {log.error_stack && (
                <pre className="text-[11px] bg-muted rounded-lg p-3 overflow-auto max-h-32 text-muted-foreground font-mono whitespace-pre-wrap break-all">
                  {log.error_stack}
                </pre>
              )}
              {log.user_agent && (
                <p className="text-[10px] text-muted-foreground/60 truncate">Browser: {log.user_agent}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Video Usage Tab ───
const VideoUsageTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // 1) Per-user monthly totals
    const { data: sessions } = await supabase
      .from("video_call_sessions")
      .select("user_id, started_at, ended_at, duration_seconds")
      .gte("started_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .order("started_at", { ascending: false });

    if (!sessions) { setLoading(false); return; }

    // aggregate per user
    const userMap = new Map<string, { total: number; sessions: number }>();
    const anomalyList: any[] = [];

    for (const s of sessions) {
      const elapsed = s.ended_at
        ? Math.max(0, Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000))
        : null;
      const effective = s.duration_seconds ?? elapsed ?? 0;

      const prev = userMap.get(s.user_id) ?? { total: 0, sessions: 0 };
      userMap.set(s.user_id, { total: prev.total + effective, sessions: prev.sessions + 1 });

      // Flag anomalies:
      // 1. duration_seconds wildly exceeds actual elapsed (>2 min gap)
      const isInflated = s.duration_seconds != null && elapsed != null && s.duration_seconds > elapsed + 120;
      // 2. Orphaned: no ended_at at all and older than 10 minutes
      const isOrphaned = !s.ended_at && (Date.now() - new Date(s.started_at).getTime()) > 600_000;

      if (isInflated || isOrphaned) {
        anomalyList.push({
          ...s,
          elapsed,
          flag: isInflated ? "Inflated duration" : "Orphaned session",
        });
      }
    }

    // Fetch profile names
    const userIds = [...userMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

    const aggregated = [...userMap.entries()]
      .map(([uid, d]) => ({ user_id: uid, name: nameMap.get(uid) || uid.slice(0, 8), ...d }))
      .sort((a, b) => b.total - a.total);

    setRows(aggregated);
    setAnomalies(anomalyList.map(a => ({ ...a, name: nameMap.get(a.user_id) || a.user_id.slice(0, 8) })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-8">
      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Anomalous Sessions ({anomalies.length})
          </h3>
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-4 text-sm">
                <div className="flex-1 space-y-0.5">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.started_at), "MMM d h:mm a")} ·
                    Recorded: {a.duration_seconds != null ? fmt(a.duration_seconds) : "—"} ·
                    Actual: {a.elapsed != null ? fmt(a.elapsed) : "—"}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive whitespace-nowrap">{a.flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-user usage table */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" /> Monthly Usage by User
        </h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Sessions</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total Used</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">% of 2 hr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const pct = Math.min(100, Math.round((r.total / 7200) * 100));
                  return (
                    <tr key={r.user_id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium truncate max-w-[200px]">{r.name}</td>
                      <td className="p-3 text-right text-muted-foreground">{r.sessions}</td>
                      <td className="p-3 text-right">{fmt(r.total)}</td>
                      <td className="p-3 text-right">
                        <span className={`font-medium ${pct >= 90 ? "text-destructive" : pct >= 70 ? "text-accent" : "text-foreground"}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No video call sessions this month.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Contact Submissions Tab ───
const ContactSubmissionsTab = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "reviewed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    let query = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(100);
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    const { data } = await query;
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, [statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("contact_submissions").update({ status }).eq("id", id);
    toast({ title: `Marked as ${status}` });
    fetchSubmissions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["all", "new", "reviewed"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={statusFilter === f ? "default" : "outline"}
            onClick={() => setStatusFilter(f)}
            className="text-xs capitalize"
          >
            {f === "all" ? `All` : f === "new" ? "New" : "Reviewed"}
          </Button>
        ))}
        <div className="flex-1" />
        <Button onClick={fetchSubmissions} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : submissions.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">No contact submissions found.</div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{s.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.status === "new" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  <p className="text-sm font-medium mt-2">{s.subject}</p>
                  {expandedId === s.id ? (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{s.message}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{s.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                    <Eye className="h-3 w-3 mr-1" /> {expandedId === s.id ? "Collapse" : "Expand"}
                  </Button>
                  {s.status === "new" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(s.id, "reviewed")}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Mark Reviewed
                    </Button>
                  )}
                  {s.status === "reviewed" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(s.id, "new")}>
                      <Inbox className="h-3 w-3 mr-1" /> Mark New
                    </Button>
                  )}
                  <a href={`mailto:${s.email}?subject=Re: ${encodeURIComponent(s.subject)}`}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs w-full">
                      <Mail className="h-3 w-3 mr-1" /> Reply
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Emails Tab ───
const EmailsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templates, setTemplates] = useState<string[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("email_send_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (templateFilter !== "all") {
      query = query.eq("template_name", templateFilter);
    }
    // Don't filter status server-side — we need all rows to deduplicate properly

    const { data } = await query;
    const rows = data || [];

    // Deduplicate by message_id (keep latest status per email)
    const seen = new Map<string, any>();
    for (const row of rows) {
      const key = row.message_id || row.id;
      if (!seen.has(key) || new Date(row.created_at) > new Date(seen.get(key).created_at)) {
        seen.set(key, row);
      }
    }
    let deduped = Array.from(seen.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setLogs(deduped);

    // Extract unique templates
    if (templates.length === 0) {
      const uniqueTemplates = [...new Set(rows.map((r: any) => r.template_name))].sort();
      setTemplates(uniqueTemplates);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [templateFilter]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: "bg-secondary/10 text-secondary",
      pending: "bg-accent/10 text-accent",
      dlq: "bg-destructive/10 text-destructive",
      failed: "bg-destructive/10 text-destructive",
      suppressed: "bg-yellow-500/10 text-yellow-600",
      bounced: "bg-destructive/10 text-destructive",
      complained: "bg-destructive/10 text-destructive",
    };
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  // Apply status filter client-side after dedup
  const filteredLogs = statusFilter === "all"
    ? logs
    : statusFilter === "dlq"
      ? logs.filter(l => ["dlq", "failed"].includes(l.status))
      : logs.filter(l => l.status === statusFilter);

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === "sent").length,
    failed: logs.filter(l => ["dlq", "failed"].includes(l.status)).length,
    pending: logs.filter(l => l.status === "pending").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Emails", value: stats.total, color: "text-primary" },
          { label: "Sent", value: stats.sent, color: "text-secondary" },
          { label: "Pending", value: stats.pending, color: "text-accent" },
          { label: "Failed", value: stats.failed, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs"
        >
          <option value="all">All Templates</option>
          {templates.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["all", "sent", "pending", "dlq"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={statusFilter === f ? "default" : "outline"}
              onClick={() => setStatusFilter(f)}
              className="text-xs capitalize"
            >
              {f === "all" ? "All" : f === "dlq" ? "Failed" : f}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={fetchLogs} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">No email logs found.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Template</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Recipient</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs font-medium">{log.template_name}</td>
                    <td className="p-3 text-xs text-muted-foreground truncate max-w-[200px]">{log.recipient_email}</td>
                    <td className="p-3 text-center">{statusBadge(log.status)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</td>
                    <td className="p-3 text-xs text-destructive truncate max-w-[200px]">{log.error_message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Analytics Tab ───
const AnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "30d" | "all">("7d");
  const [deviceData, setDeviceData] = useState<{ label: string; count: number; icon: typeof Monitor; color: string; bg: string }[]>([]);
  const [browserData, setBrowserData] = useState<{ name: string; count: number }[]>([]);
  const [osData, setOsData] = useState<{ name: string; count: number }[]>([]);
  const [topPages, setTopPages] = useState<{ path: string; count: number }[]>([]);
  const [referrerData, setReferrerData] = useState<{ source: string; count: number }[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [userVisits, setUserVisits] = useState<{ email: string; full_name: string; device_type: string; browser: string; os: string; referrer: string; last_visit: string; visit_count: number; ip_address: string; country: string }[]>([]);

  const iconMap: Record<string, typeof Monitor> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };
  const colorMap: Record<string, { color: string; bg: string }> = {
    desktop: { color: "text-blue-500", bg: "bg-blue-500" },
    mobile: { color: "text-emerald-500", bg: "bg-emerald-500" },
    tablet: { color: "text-amber-500", bg: "bg-amber-500" },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from("page_visits").select("*" as any).order("created_at", { ascending: false });

      if (range !== "all") {
        const since = new Date();
        since.setDate(since.getDate() - (range === "7d" ? 7 : 30));
        query = query.gte("created_at", since.toISOString());
      }

      const { data } = await query.limit(1000) as { data: any[] | null };
      const visits = data || [];
      setTotalVisits(visits.length);

      // Unique visitors by user_id (or user_agent for anonymous)
      const uniqueSet = new Set(visits.map((v: any) => v.user_id || v.user_agent));
      setUniqueVisitors(uniqueSet.size);

      // Device breakdown
      const deviceCounts: Record<string, number> = {};
      visits.forEach((v: any) => {
        const dt = v.device_type || "desktop";
        deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
      });
      setDeviceData(
        Object.entries(deviceCounts)
          .map(([type, count]) => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            count,
            icon: iconMap[type] || Monitor,
            ...(colorMap[type] || colorMap.desktop),
          }))
          .sort((a, b) => b.count - a.count)
      );

      // Browser breakdown
      const browserCounts: Record<string, number> = {};
      visits.forEach((v: any) => { browserCounts[v.browser || "Other"] = (browserCounts[v.browser || "Other"] || 0) + 1; });
      setBrowserData(Object.entries(browserCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      // OS breakdown
      const osCounts: Record<string, number> = {};
      visits.forEach((v: any) => { osCounts[v.os || "Other"] = (osCounts[v.os || "Other"] || 0) + 1; });
      setOsData(Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      // Top pages
      const pageCounts: Record<string, number> = {};
      visits.forEach((v: any) => { pageCounts[v.page_path || "/"] = (pageCounts[v.page_path || "/"] || 0) + 1; });
      setTopPages(Object.entries(pageCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10));

      // Referrers
      const refCounts: Record<string, number> = {};
      visits.forEach((v: any) => {
        let source = "Direct";
        if (v.referrer) {
          try { source = new URL(v.referrer).hostname; } catch { source = v.referrer; }
        }
        refCounts[source] = (refCounts[source] || 0) + 1;
      });
      setReferrerData(Object.entries(refCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 10));

      // Per-user visit details: aggregate by user_id
      const userIds = [...new Set(visits.filter((v: any) => v.user_id).map((v: any) => v.user_id))] as string[];
      let profileMap = new Map<string, { full_name: string; email: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds.slice(0, 100));
        (profiles || []).forEach((p: any) => profileMap.set(p.id, { full_name: p.full_name || "Unknown", email: p.email || "" }));
      }

      const visitRows = visits.map((v: any) => {
        const profile = v.user_id ? profileMap.get(v.user_id) : undefined;
        let source = "Direct";
        if (v.referrer) { try { source = new URL(v.referrer).hostname; } catch { source = v.referrer; } }
        return {
          email: profile?.email || (v.user_id ? "—" : "Anonymous"),
          full_name: profile?.full_name || (v.user_id ? "—" : "Anonymous"),
          device_type: v.device_type || "desktop",
          browser: v.browser || "Other",
          os: v.os || "Other",
          referrer: source,
          last_visit: v.created_at,
          visit_count: 1,
          ip_address: v.ip_address || "—",
          country: v.country || "—",
        };
      }).filter((r) => r.email !== "seanintagent@gmail.com");
      setUserVisits(visitRows.sort((a, b) => b.last_visit.localeCompare(a.last_visit)));

      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [range]);

  const totalDevices = deviceData.reduce((s, d) => s + d.count, 0) || 1;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "all"] as const).map((r) => (
          <Button key={r} size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)} className="text-xs">
            {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All time"}
          </Button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Page Views", value: totalVisits.toLocaleString(), icon: Eye, color: "text-blue-500" },
          { label: "Unique Visitors", value: uniqueVisitors.toLocaleString(), icon: Users, color: "text-primary" },
          { label: "Top Device", value: deviceData[0]?.label || "—", icon: Monitor, color: "text-emerald-500" },
          { label: "Top Browser", value: browserData[0]?.name || "—", icon: Globe, color: "text-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Device Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" /> Device Breakdown
        </h3>
        {deviceData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visit data yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {deviceData.map((d) => (
                <div key={d.label} className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${d.bg}/10 flex items-center justify-center`}>
                    <d.icon className={`h-6 w-6 ${d.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{d.label}</p>
                    <p className="text-2xl font-bold text-foreground">{d.count}</p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {((d.count / totalDevices) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="h-4 rounded-full overflow-hidden flex bg-muted">
              {deviceData.map((d) => (
                <div key={d.label} className={`${d.bg} transition-all`} style={{ width: `${(d.count / totalDevices) * 100}%` }} title={`${d.label}: ${d.count}`} />
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              {deviceData.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`h-2.5 w-2.5 rounded-full ${d.bg}`} />
                  {d.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Browser Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-secondary" /> Browsers
          </h3>
          <div className="space-y-2">
            {browserData.map((b) => {
              const pct = (b.count / totalDevices) * 100;
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20 text-foreground">{b.name}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* OS Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" /> Operating Systems
          </h3>
          <div className="space-y-2">
            {osData.map((o) => {
              const pct = (o.count / totalDevices) * 100;
              return (
                <div key={o.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20 text-foreground">{o.name}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{o.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Top Pages
          </h3>
          <div className="space-y-2">
            {topPages.map((p) => {
              const pct = (p.count / totalDevices) * 100;
              return (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-36 truncate text-foreground">{p.path}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{p.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> Traffic Sources
          </h3>
          <div className="space-y-2">
            {referrerData.map((s) => {
              const pct = (s.count / totalDevices) * 100;
              return (
                <div key={s.source} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-36 truncate text-foreground">{s.source}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-User Visit Details */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> User Visit Details
        </h3>
        {userVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No user visit data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">User</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">IP Address</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">Country</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">Device</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">Browser</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">OS</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">Came From</th>
                   <th className="pb-3 pr-4 font-medium text-muted-foreground">Visits</th>
                   <th className="pb-3 font-medium text-muted-foreground">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {userVisits.slice(0, 100).map((u, i) => {
                  const deviceIcon = u.device_type === "mobile" ? Smartphone : u.device_type === "tablet" ? Tablet : Monitor;
                  const DeviceIcon = deviceIcon;
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground truncate max-w-[160px]">{u.full_name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</span>
                        </div>
                      </td>
                       <td className="py-3 pr-4 text-foreground text-xs font-mono">{u.ip_address}</td>
                       <td className="py-3 pr-4 text-foreground text-sm">{u.country}</td>
                       <td className="py-3 pr-4">
                         <div className="flex items-center gap-1.5">
                           <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                           <span className="capitalize text-foreground">{u.device_type}</span>
                         </div>
                       </td>
                      <td className="py-3 pr-4 text-foreground">{u.browser}</td>
                      <td className="py-3 pr-4 text-foreground">{u.os}</td>
                      <td className="py-3 pr-4">
                        <span className="text-foreground truncate max-w-[140px] block">{u.referrer}</span>
                      </td>
                      <td className="py-3 pr-4 text-center font-medium text-foreground">{u.visit_count}</td>
                      <td className="py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(u.last_visit).toLocaleString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {userVisits.length > 100 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">Showing top 100 of {userVisits.length} visitors</p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Live analytics from tracked page visits. Data updates in real-time as users browse.
      </p>
    </div>
  );
};

// ─── Flagged Users Tab ───
const FlaggedUsersTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  const fetchFlags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "flagged_user")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading flags", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setFlags(data || []);

    // Load avatars for flagged users
    const userIds = [...new Set((data || []).map((f: any) => f.related_user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, user_type, country, created_at")
        .in("id", userIds);
      if (profiles) {
        const avatarMap: Record<string, string> = {};
        for (const p of profiles) {
          if (p.avatar_url) {
            const url = await getSignedPhotoUrl(p.avatar_url);
            if (url) avatarMap[p.id] = url;
          }
        }
        setAvatars(avatarMap);
        // Store profile data for display
        setFlagProfiles(profiles.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {}));
      }
    }

    setLoading(false);
  };

  const [flagProfiles, setFlagProfiles] = useState<Record<string, any>>({});

  useEffect(() => { fetchFlags(); }, []);

  const dismissFlag = async (notifId: string, userId: string | null) => {
    if (userId) {
      const { error } = await supabase.rpc("admin_unflag_user", { target_user_id: userId });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      await supabase.from("notifications").update({ read: true }).eq("id", notifId);
    }
    toast({ title: "Flag cleared", description: "User can use Discover and messaging again." });
    fetchFlags();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const unresolvedFlags = flags.filter(f => !f.read);
  const resolvedFlags = flags.filter(f => f.read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Flag className="h-5 w-5 text-destructive" /> Flagged Users
          {unresolvedFlags.length > 0 && (
            <span className="ml-2 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">
              {unresolvedFlags.length}
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchFlags}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {unresolvedFlags.length === 0 && resolvedFlags.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Flag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No flagged users</p>
          <p className="text-sm">Users selecting "Foreigner" with a Philippine IP will appear here.</p>
        </div>
      )}

      {unresolvedFlags.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending Review ({unresolvedFlags.length})</h3>
          {unresolvedFlags.map((flag) => {
            const profile = flagProfiles[flag.related_user_id];
            return (
              <div key={flag.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {avatars[flag.related_user_id] ? (
                      <img src={avatars[flag.related_user_id]} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{profile?.full_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.country || "—"} · {profile?.user_type || "—"} · Joined {profile?.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/profile/${flag.related_user_id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => dismissFlag(flag.id)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Dismiss
                    </Button>
                  </div>
                </div>
                <div className="rounded bg-background/80 p-2.5 text-xs text-muted-foreground border">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-destructive" />
                  {flag.body}
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(flag.created_at), "MMM d, yyyy hh:mm a")}</p>
              </div>
            );
          })}
        </div>
      )}

      {resolvedFlags.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Dismissed ({resolvedFlags.length})</h3>
          {resolvedFlags.map((flag) => {
            const profile = flagProfiles[flag.related_user_id];
            return (
              <div key={flag.id} className="rounded-lg border p-4 opacity-60 space-y-1">
                <div className="flex items-center gap-3">
                  {avatars[flag.related_user_id] ? (
                    <img src={avatars[flag.related_user_id]} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{profile?.full_name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{flag.body}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(flag.created_at), "MMM d, yyyy hh:mm a")}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ─── Main Admin Dashboard ───
// ─── Deletions Tab ───
const DeletionsTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, cancelled: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("account_deletions" as any)
      .select("id, user_id, status, created_at, scheduled_for, completed_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const [{ data: deletions }, pendingC, completedC, cancelledC] = await Promise.all([
      query,
      supabase.from("account_deletions" as any).select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("account_deletions" as any).select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("account_deletions" as any).select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    ]);

    // Hydrate user emails/names from profiles (may be missing for completed deletions)
    const userIds = (deletions || []).map((d: any) => d.user_id);
    let profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);
      (profs || []).forEach((p: any) => {
        profileMap[p.id] = { email: p.email, full_name: p.full_name };
      });
    }

    setRows((deletions || []).map((d: any) => ({
      ...d,
      email: profileMap[d.user_id]?.email || null,
      full_name: profileMap[d.user_id]?.full_name || null,
    })));
    setStats({
      pending: pendingC.count || 0,
      completed: completedC.count || 0,
      cancelled: cancelledC.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const fmtPH = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) : "—";

  const cancelDeletion = async (id: string) => {
    if (!confirm("Cancel this scheduled deletion? The user's account will be restored.")) return;
    const { error } = await supabase
      .from("account_deletions" as any)
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to cancel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deletion cancelled" });
      load();
    }
  };

  const exportCsv = () => {
    const header = ["Status", "Email", "Name", "User ID", "Requested (PHT)", "Scheduled (PHT)", "Completed (PHT)"];
    const lines = rows.map((r) => [
      r.status, r.email || "", r.full_name || "", r.user_id,
      fmtPH(r.created_at), fmtPH(r.scheduled_for), fmtPH(r.completed_at),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-deletions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-destructive">{stats.completed}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Cancelled (Restored)</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.cancelled}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Requested</th>
                <th className="text-left p-3 font-medium">Scheduled</th>
                <th className="text-left p-3 font-medium">Completed</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No deletion records.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "pending" ? "bg-amber-500/15 text-amber-700" :
                      r.status === "completed" ? "bg-destructive/15 text-destructive" :
                      "bg-emerald-500/15 text-emerald-700"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{r.full_name || <span className="text-muted-foreground italic">deleted</span>}</div>
                    <div className="text-xs text-muted-foreground">{r.email || r.user_id.slice(0, 8) + "…"}</div>
                  </td>
                  <td className="p-3 text-xs">{fmtPH(r.created_at)}</td>
                  <td className="p-3 text-xs">{fmtPH(r.scheduled_for)}</td>
                  <td className="p-3 text-xs">{fmtPH(r.completed_at)}</td>
                  <td className="p-3 text-right">
                    {r.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => cancelDeletion(r.id)}>
                        Restore
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">All times in Philippine Time (GMT+8).</p>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [subsRefreshKey, setSubsRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate("/profile")}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <BarChart3 className="h-6 w-6 text-primary" /> Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your platform from here</p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6" onValueChange={(v) => { if (v === "subscriptions") setSubsRefreshKey(k => k + 1); }}>
            <TabsList className="grid w-full grid-cols-12 lg:grid-cols-12 max-w-6xl">
              <TabsTrigger value="dashboard" className="text-xs"><TrendingUp className="h-3.5 w-3.5 mr-1" /> Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" /> Users</TabsTrigger>
              <TabsTrigger value="flagged" className="text-xs"><Flag className="h-3.5 w-3.5 mr-1" /> Flagged</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs"><Activity className="h-3.5 w-3.5 mr-1" /> Analytics</TabsTrigger>
              <TabsTrigger value="moderation" className="text-xs"><Shield className="h-3.5 w-3.5 mr-1" /> Moderation</TabsTrigger>
              <TabsTrigger value="subscriptions" className="text-xs"><CreditCard className="h-3.5 w-3.5 mr-1" /> Subs</TabsTrigger>
              <TabsTrigger value="features" className="text-xs"><ToggleRight className="h-3.5 w-3.5 mr-1" /> Features</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs"><Inbox className="h-3.5 w-3.5 mr-1" /> Contact</TabsTrigger>
              <TabsTrigger value="emails" className="text-xs"><Mail className="h-3.5 w-3.5 mr-1" /> Emails</TabsTrigger>
              <TabsTrigger value="video" className="text-xs"><Video className="h-3.5 w-3.5 mr-1" /> Video</TabsTrigger>
              <TabsTrigger value="crashes" className="text-xs"><Bug className="h-3.5 w-3.5 mr-1" /> Crashes</TabsTrigger>
              <TabsTrigger value="deletions" className="text-xs"><UserMinus className="h-3.5 w-3.5 mr-1" /> Deletions</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard"><DashboardTab /></TabsContent>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="flagged"><FlaggedUsersTab /></TabsContent>
            <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
            <TabsContent value="moderation"><ModerationTab /></TabsContent>
            <TabsContent value="subscriptions"><SubscriptionsTab refreshKey={subsRefreshKey} /></TabsContent>
            <TabsContent value="features"><FeatureFlagsTab /></TabsContent>
            <TabsContent value="contact"><ContactSubmissionsTab /></TabsContent>
            <TabsContent value="emails"><EmailsTab /></TabsContent>
            <TabsContent value="video"><VideoUsageTab /></TabsContent>
            <TabsContent value="crashes"><CrashLogsTab /></TabsContent>
            <TabsContent value="deletions"><DeletionsTab /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
