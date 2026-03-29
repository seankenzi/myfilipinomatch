import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, ArrowLeft, Shield, Lock, MessageCircle, Sparkles,
  Flag, Ban, AlertTriangle, MoreVertical, MapPin, Crown, Video
} from "lucide-react";
import VideoCallModal from "@/components/VideoCallModal";
import { detectContactInfo } from "@/lib/contactFilter";
import OnlineStatus from "@/components/OnlineStatus";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import VideoCall from "@/components/VideoCall";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";

const FREE_MESSAGE_LIMIT = 3; // Only applies to premium direct-message matches (non-mutual)
const FREE_DAILY_MESSAGE_LIMIT = 10; // Daily limit for free users on mutual matches

interface MatchProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  photos: string[] | null;
  is_verified: boolean | null;
  age: number | null;
  city: string | null;
  country: string | null;
  is_premium: boolean | null;
  last_seen: string | null;
}

interface Match {
  id: string;
  other_user: MatchProfile;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean | null;
  };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean | null;
}

const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

const getPhoto = (user: { avatar_url: string | null; photos: string[] | null }) => {
  if (user.photos && user.photos.length > 0) return user.photos[0];
  return user.avatar_url;
};

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfile, setMyProfile] = useState<{ is_premium: boolean | null } | null>(null);

  // Report dialog
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  // Video call
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [videoUpgradeOpen, setVideoUpgradeOpen] = useState(false);

  // My sent message count for current match (total)
  const mySentCount = messages.filter((m) => m.sender_id === user?.id).length;
  // My sent message count for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const mySentTodayCount = messages.filter(
    (m) => m.sender_id === user?.id && new Date(m.created_at) >= todayStart
  ).length;
  const isPremium = myProfile?.is_premium === true;
  const [isMutualMatch, setIsMutualMatch] = useState(true);

  // Check if this is a mutual match (both users liked each other)
  useEffect(() => {
    if (!selectedMatch || !user) return;
    const checkMutual = async () => {
      const otherId = selectedMatch.other_user.id;
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", otherId)
        .eq("liked_id", user.id)
        .limit(1);
      setIsMutualMatch(!!(data && data.length > 0));
    };
    checkMutual();
  }, [selectedMatch, user]);

  // Non-mutual: total message limit; Mutual free: 10/day limit
  const isLocked = !isPremium && (
    isMutualMatch
      ? mySentTodayCount >= FREE_DAILY_MESSAGE_LIMIT
      : mySentCount >= FREE_MESSAGE_LIMIT
  );
  const remainingFree = isPremium
    ? Infinity
    : isMutualMatch
      ? Math.max(0, FREE_DAILY_MESSAGE_LIMIT - mySentTodayCount)
      : Math.max(0, FREE_MESSAGE_LIMIT - mySentCount);

  // Fetch own profile for premium status
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setMyProfile(data);
      });
  }, [user]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get blocked users to exclude
    const { data: blockedData } = await supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedIds = new Set((blockedData || []).map((b: any) => b.blocked_id));

    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading matches", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!matchesData || matchesData.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    // Filter out blocked users
    const filteredMatches = matchesData.filter((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      return !blockedIds.has(otherId);
    });

    const otherUserIds = filteredMatches.map((m) =>
      m.user1_id === user.id ? m.user2_id : m.user1_id
    );

    if (otherUserIds.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, photos, is_verified, age, city, country, is_premium, last_seen")
      .in("id", otherUserIds);

    const profileMap = new Map(
      (profilesData || []).map((p) => [p.id, p])
    );

    const matchList: Match[] = [];
    for (const m of filteredMatches) {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const profile = profileMap.get(otherId);
      if (!profile) continue;

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, read")
        .eq("match_id", m.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("match_id", m.id)
        .eq("read", false)
        .neq("sender_id", user.id);

      matchList.push({
        id: m.id,
        other_user: profile as MatchProfile,
        last_message: lastMsg || undefined,
        unread_count: count || 0,
      });
    }

    matchList.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      const aTime = a.last_message?.created_at || "0";
      const bTime = b.last_message?.created_at || "0";
      return bTime.localeCompare(aTime);
    });

    setMatches(matchList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const fetchMessages = useCallback(async () => {
    if (!selectedMatch || !user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", selectedMatch.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("match_id", selectedMatch.id)
        .neq("sender_id", user.id)
        .eq("read", false);
    }
  }, [selectedMatch, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time
  useEffect(() => {
    if (!selectedMatch) return;
    const channel = supabase
      .channel(`messages-${selectedMatch.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${selectedMatch.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id !== user?.id) {
          supabase.from("messages").update({ read: true }).eq("id", newMsg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedMatch, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedMatch || !user || sending || isLocked) return;
    if (newMessage.trim().length > 1000) {
      toast({ title: "Message too long", description: "Max 1000 characters.", variant: "destructive" });
      return;
    }
    const content = newMessage.trim();
    const contactType = detectContactInfo(content);
    if (contactType) {
      toast({
        title: "Contact sharing not allowed",
        description: `For your safety, sharing ${contactType} is not permitted. Keep conversations on MyFilipinoMatch.`,
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    setNewMessage("");
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      match_id: selectedMatch.id,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      setNewMessage(content);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlock = async () => {
    if (!selectedMatch || !user) return;
    if (!confirm(`Block ${selectedMatch.other_user.full_name}? They won't be able to contact you.`)) return;

    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: selectedMatch.other_user.id,
    });

    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User blocked", description: `${selectedMatch.other_user.full_name} has been blocked.` });
      setSelectedMatch(null);
      fetchMatches();
    }
  };

  const handleReport = () => {
    setReportReason("");
    setReportDetails("");
    setReportDialog(true);
  };

  const submitReport = async () => {
    if (!selectedMatch || !user || !reportReason) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: selectedMatch.other_user.id,
      reason: reportReason,
      details: reportDetails || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report submitted", description: "Thank you for keeping our community safe." });
    }
    setReportDialog(false);
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.created_at);
    let label: string;
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else label = format(date, "MMMM d, yyyy");
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup?.date === label) lastGroup.messages.push(msg);
    else groupedMessages.push({ date: label, messages: [msg] });
  });

  const location = selectedMatch
    ? [selectedMatch.other_user.city, selectedMatch.other_user.country].filter(Boolean).join(", ")
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pb-16 md:pb-0">
        {/* Match List Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col ${
            selectedMatch ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Messages</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {matches.length} conversation{matches.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-foreground mb-1">No matches yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start discovering people to get your first match!
                </p>
                <Button variant="hero" size="sm" onClick={() => navigate("/discover")}>
                  Discover People
                </Button>
              </div>
            ) : (
              matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`w-full flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 text-left ${
                    selectedMatch?.id === match.id ? "bg-muted/70" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {getPhoto(match.other_user) ? (
                      <img
                        src={getPhoto(match.other_user)!}
                        alt={match.other_user.full_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg">👤</div>
                    )}
                    {match.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {match.unread_count}
                      </span>
                    )}
                    <OnlineStatus lastSeen={match.other_user.last_seen} size="sm" className="absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm truncate ${match.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                          {match.other_user.full_name}
                          {match.other_user.age ? `, ${match.other_user.age}` : ""}
                        </span>
                        {match.other_user.is_verified && (
                          <Shield className="h-3.5 w-3.5 text-secondary fill-secondary/30 flex-shrink-0" />
                        )}
                      </div>
                      {match.last_message && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {formatMessageTime(match.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${match.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {match.last_message
                        ? `${match.last_message.sender_id === user?.id ? "You: " : ""}${match.last_message.content}`
                        : "Start a conversation!"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedMatch ? "flex" : "hidden md:flex"}`}>
          {selectedMatch ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="md:hidden rounded-lg p-1.5 hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {getPhoto(selectedMatch.other_user) ? (
                  <img
                    src={getPhoto(selectedMatch.other_user)!}
                    alt={selectedMatch.other_user.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">👤</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-semibold text-sm truncate">
                      {selectedMatch.other_user.full_name}
                      {selectedMatch.other_user.age ? `, ${selectedMatch.other_user.age}` : ""}
                    </h2>
                    {selectedMatch.other_user.is_verified && (
                      <Shield className="h-3.5 w-3.5 text-secondary fill-secondary/30 flex-shrink-0" />
                    )}
                  </div>
                  <OnlineStatus lastSeen={selectedMatch.other_user.last_seen} size="sm" showText />
                </div>

                {/* Video call button */}
                <button
                  onClick={() => setVideoCallOpen(true)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                  title="Video Call"
                >
                  <Video className="h-4 w-4 text-primary" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-2 hover:bg-muted transition-colors">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBlock} className="text-destructive focus:text-destructive">
                      <Ban className="h-4 w-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Anti-scam banner */}
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border-b border-accent/20">
                <AlertTriangle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <p className="text-[11px] text-accent font-medium">
                  Do not send money to someone you just met online. <a href="/safety" className="underline">Stay safe</a>
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mx-auto max-w-2xl space-y-1">
                  {/* Contact sharing warning */}
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-4">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      <strong>Safety reminder:</strong> Sharing contact info (phone numbers, emails, social media) is not allowed. Keep all conversations on MyFilipinoMatch for your protection.
                    </p>
                  </div>

                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">You matched! Send the first message 🎉</p>
                    </div>
                  )}

                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <div className="flex justify-center my-4">
                        <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex mb-1.5 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              msg.sender_id === user?.id
                                ? "gradient-hero text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`mt-1 text-[10px] ${
                              msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}>
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* Chat upgrade trigger after 5+ messages */}
                  {!isPremium && messages.length >= 5 && (
                    <div className="flex justify-center my-4">
                      <button
                        onClick={() => setVideoUpgradeOpen(true)}
                        className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center transition-colors hover:bg-primary/10 max-w-xs"
                      >
                        <p className="text-sm font-medium text-foreground">💡 Ready to take this further?</p>
                        <p className="text-xs text-primary mt-1">🎥 Video calls are included in Annual</p>
                      </button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input / Locked State */}
              {isLocked ? (
                <div className="border-t border-border bg-card p-5">
                  <div className="mx-auto max-w-md text-center">
                    <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {isMutualMatch ? "Daily message limit reached" : "You've reached your free message limit"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {isMutualMatch
                        ? `You've sent ${FREE_DAILY_MESSAGE_LIMIT} messages today. Upgrade to Premium for unlimited messaging, or come back tomorrow!`
                        : `Upgrade to Premium to continue chatting with ${selectedMatch.other_user.full_name.split(" ")[0]} and unlock unlimited messaging.`}
                    </p>
                    <Button
                      variant="hero"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => navigate("/premium")}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border bg-card">
                  {/* Remaining messages indicator */}
                  {!isPremium && remainingFree !== Infinity && (
                    <div className="flex items-center justify-between px-4 py-1.5 bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {remainingFree} {isMutualMatch ? "daily " : "free "}message{remainingFree !== 1 ? "s" : ""} remaining
                      </div>
                      <button
                        onClick={() => navigate("/premium")}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Go Premium
                      </button>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="mx-auto max-w-2xl flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value.slice(0, 1000))}
                        onKeyDown={handleKeyDown}
                        maxLength={1000}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero text-primary-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <MessageCircle className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">Choose a match to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Report User
            </DialogTitle>
            <DialogDescription>
              Why are you reporting {selectedMatch?.other_user.full_name}?
            </DialogDescription>
          </DialogHeader>
          <Select value={reportReason} onValueChange={setReportReason}>
            <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fake-profile">Fake profile</SelectItem>
              <SelectItem value="inappropriate-content">Inappropriate content</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="scam">Scam / fraud</SelectItem>
              <SelectItem value="underage">Underage user</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Additional details (optional)..."
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value.slice(0, 500))}
            rows={2}
            maxLength={500}
          />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" variant="destructive" onClick={submitReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Call */}
      {selectedMatch && (
        <VideoCall
          matchId={selectedMatch.id}
          otherUserName={selectedMatch.other_user.full_name}
          open={videoCallOpen}
          onClose={() => setVideoCallOpen(false)}
        />
      )}

      {/* Video Call Upgrade Modal */}
      <VideoCallModal
        open={videoUpgradeOpen}
        onOpenChange={setVideoUpgradeOpen}
        userName={selectedMatch?.other_user.full_name}
      />

      <BottomNav />
    </div>
  );
};

export default Messages;