import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Heart, MessageSquare, Shield, CreditCard, TrendingUp,
  BarChart3, ArrowLeft, Search, Ban, CheckCircle, XCircle,
  Clock, Eye, Star, AlertTriangle, RefreshCw, ToggleLeft, ToggleRight,
  Plus, Trash2
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
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
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

  useEffect(() => { fetchUsers(); }, []);

  const handleVerify = async (userId: string, verified: boolean) => {
    await supabase.from("profiles").update({ is_verified: verified }).eq("id", userId);
    toast({ title: verified ? "User verified ✅" : "Verification removed" });
    fetchUsers();
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                  <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {u.avatar_url ? <img src={u.avatar_url} className="h-full w-full object-cover" /> : <Users className="h-full w-full p-1.5 text-muted-foreground" />}
                        </div>
                        <span className="font-medium truncate max-w-[150px]">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">{u.email || "—"}</td>
                    <td className="p-3 text-center">
                      {u.is_verified ? <CheckCircle className="h-4 w-4 text-secondary mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {u.is_premium ? <Star className="h-4 w-4 text-accent mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{format(new Date(u.created_at), "MMM d, yyyy")}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleVerify(u.id, !u.is_verified)}>
                          {u.is_verified ? "Unverify" : "Verify"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handlePremium(u.id, !u.is_premium)}>
                          {u.is_premium ? "Remove Premium" : "Grant Premium"}
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
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [reportsRes, verificationsRes] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("verifications").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
    ]);

    // Enrich with profile names
    const allUserIds = [
      ...new Set([
        ...(reportsRes.data || []).flatMap(r => [r.reporter_id, r.reported_id]),
        ...(verificationsRes.data || []).map(v => v.user_id),
      ])
    ];

    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", allUserIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setReports((reportsRes.data || []).map(r => ({
      ...r,
      reporter_name: profileMap.get(r.reporter_id)?.full_name || "Unknown",
      reported_name: profileMap.get(r.reported_id)?.full_name || "Unknown",
    })));

    setVerifications((verificationsRes.data || []).map(v => ({
      ...v,
      user_name: profileMap.get(v.user_id)?.full_name || "Unknown",
    })));

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
                  <img src={v.document_url} className="h-14 w-14 rounded-lg object-cover border border-border" />
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

// ─── Main Admin Dashboard ───
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
            <TabsList className="grid w-full grid-cols-5 max-w-2xl">
              <TabsTrigger value="dashboard" className="text-xs"><TrendingUp className="h-3.5 w-3.5 mr-1" /> Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" /> Users</TabsTrigger>
              <TabsTrigger value="moderation" className="text-xs"><Shield className="h-3.5 w-3.5 mr-1" /> Moderation</TabsTrigger>
              <TabsTrigger value="subscriptions" className="text-xs"><CreditCard className="h-3.5 w-3.5 mr-1" /> Subs</TabsTrigger>
              <TabsTrigger value="features" className="text-xs"><ToggleRight className="h-3.5 w-3.5 mr-1" /> Features</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard"><DashboardTab /></TabsContent>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="moderation"><ModerationTab /></TabsContent>
            <TabsContent value="subscriptions"><SubscriptionsTab refreshKey={subsRefreshKey} /></TabsContent>
            <TabsContent value="features"><FeatureFlagsTab /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
