import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, ArrowLeft, Shield, Lock, MessageCircle, Sparkles,
  Flag, Ban, AlertTriangle, MoreVertical, MapPin, Crown, Video, Heart,
  Check, CheckCheck
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
import { getSignedPhotoUrl } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

const FREE_MESSAGE_LIMIT = 3;
const FREE_DAILY_MESSAGE_LIMIT = 10;

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

const resolvePhoto = async (photoPath: string | null): Promise<string | null> => {
  if (!photoPath) return null;
  return getSignedPhotoUrl(photoPath);
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

  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [videoUpgradeOpen, setVideoUpgradeOpen] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingBroadcastRef = useRef<number>(0);

  const mySentCount = messages.filter((m) => m.sender_id === user?.id).length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const mySentTodayCount = messages.filter(
    (m) => m.sender_id === user?.id && new Date(m.created_at) >= todayStart
  ).length;
  const isPremium = myProfile?.is_premium === true;
  const [isMutualMatch, setIsMutualMatch] = useState(true);

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

    const resolvedProfiles = await Promise.all(
      (profilesData || []).map(async (p) => {
        const photo = getPhoto(p);
        const signedUrl = await resolvePhoto(photo);
        return {
          ...p,
          avatar_url: signedUrl,
          photos: p.photos ? [signedUrl].filter(Boolean) as string[] : null,
        };
      })
    );

    const profileMap = new Map(resolvedProfiles.map((p) => [p.id, p]));

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

  // Realtime: new messages, read updates, and typing indicators
  useEffect(() => {
    if (!selectedMatch || !user) return;
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
          setIsOtherTyping(false); // They sent a message, so they stopped typing
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${selectedMatch.id}`,
      }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read } : m))
        );
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id !== user.id) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsOtherTyping(false);
    };
  }, [selectedMatch, user]);

  // Broadcast typing indicator (throttled to once per 2s)
  const broadcastTyping = useCallback(() => {
    if (!selectedMatch || !user) return;
    const now = Date.now();
    if (now - lastTypingBroadcastRef.current < 2000) return;
    lastTypingBroadcastRef.current = now;
    supabase.channel(`messages-${selectedMatch.id}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
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
        {/* ──── Match List Sidebar ──── */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col ${
            selectedMatch ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Messages
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {matches.length} conversation{matches.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5 text-base" style={{ fontFamily: 'var(--font-display)' }}>
                  No matches yet
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-[220px]">
                  Start discovering people to find your first match!
                </p>
                <Button variant="hero" size="sm" onClick={() => navigate("/discover")} className="rounded-full px-6">
                  Discover People
                </Button>
              </div>
            ) : (
              <div className="py-1">
                {matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-all text-left relative group ${
                      selectedMatch?.id === match.id
                        ? "bg-primary/8 border-l-[3px] border-l-primary"
                        : "hover:bg-muted/60 border-l-[3px] border-l-transparent"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {getPhoto(match.other_user) ? (
                        <img
                          src={getPhoto(match.other_user)!}
                          alt={match.other_user.full_name}
                          className="h-13 w-13 rounded-full object-cover ring-2 ring-border"
                          style={{ height: '52px', width: '52px' }}
                        />
                      ) : (
                        <div className="rounded-full bg-muted flex items-center justify-center text-lg ring-2 ring-border" style={{ height: '52px', width: '52px' }}>
                          👤
                        </div>
                      )}
                      {match.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                          {match.unread_count}
                        </span>
                      )}
                      <OnlineStatus lastSeen={match.other_user.last_seen} size="sm" className="absolute -bottom-0.5 -right-0.5 ring-2 ring-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm truncate ${match.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
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
                      <p className={`text-[13px] truncate leading-snug ${match.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {match.last_message
                          ? `${match.last_message.sender_id === user?.id ? "You: " : ""}${match.last_message.content}`
                          : "Start a conversation! 👋"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ──── Chat Area ──── */}
        <div className={`flex-1 flex flex-col ${selectedMatch ? "flex" : "hidden md:flex"}`}>
          {selectedMatch ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="md:hidden rounded-full p-2 hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <button
                  onClick={() => navigate(`/profile/${selectedMatch.other_user.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                  <div className="relative">
                    {getPhoto(selectedMatch.other_user) ? (
                      <img
                        src={getPhoto(selectedMatch.other_user)!}
                        alt={selectedMatch.other_user.full_name}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20">👤</div>
                    )}
                    <OnlineStatus lastSeen={selectedMatch.other_user.last_seen} size="sm" className="absolute -bottom-0.5 -right-0.5 ring-2 ring-card" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {selectedMatch.other_user.full_name}
                        {selectedMatch.other_user.age ? `, ${selectedMatch.other_user.age}` : ""}
                      </h2>
                      {selectedMatch.other_user.is_verified && (
                        <Shield className="h-3.5 w-3.5 text-secondary fill-secondary/30 flex-shrink-0" />
                      )}
                    </div>
                    {location ? (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{location}</span>
                      </div>
                    ) : (
                      <OnlineStatus lastSeen={selectedMatch.other_user.last_seen} size="sm" showText />
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setVideoCallOpen(true)}
                    className="rounded-full p-2.5 hover:bg-primary/10 transition-colors"
                    title="Video Call"
                  >
                    <Video className="h-[18px] w-[18px] text-primary" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full p-2.5 hover:bg-muted transition-colors">
                        <MoreVertical className="h-[18px] w-[18px] text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
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
              </div>

              {/* Anti-scam banner */}
              <div className="flex items-center gap-2.5 px-4 py-2 bg-accent/8 border-b border-accent/15">
                <AlertTriangle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <p className="text-[11px] text-accent/90">
                  Never send money to someone you just met online.{" "}
                  <a href="/safety" className="font-medium underline underline-offset-2 hover:text-accent">Stay safe</a>
                </p>
              </div>

              {/* ──── Messages ──── */}
              <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(180deg, hsl(var(--muted) / 0.3) 0%, hsl(var(--background)) 100%)' }}>
                <div className="px-4 py-4 mx-auto max-w-2xl">
                  {/* Safety notice */}
                  <div className="flex items-start gap-2.5 rounded-xl bg-accent/5 border border-accent/15 p-3.5 mb-5">
                    <Shield className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Safety reminder:</strong> Sharing contact info (phone numbers, emails, social media) is not allowed. Keep conversations on MyFilipinoMatch.
                    </p>
                  </div>

                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">You matched! 🎉</p>
                      <p className="text-xs text-muted-foreground">Send the first message to start the conversation</p>
                    </div>
                  )}

                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <div className="flex justify-center my-5">
                        <span className="rounded-full bg-muted/80 backdrop-blur-sm px-3.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
                          {group.date}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {group.messages.map((msg, idx) => {
                          const isMe = msg.sender_id === user?.id;
                          const nextMsg = group.messages[idx + 1];
                          const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex ${isMe ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-3" : "mb-0.5"}`}
                            >
                              <div
                                className={`max-w-[75%] px-4 py-2.5 ${
                                  isMe
                                    ? `gradient-hero text-primary-foreground shadow-sm ${isLastInGroup ? "rounded-2xl rounded-br-lg" : "rounded-2xl"}`
                                    : `bg-card text-foreground border border-border shadow-sm ${isLastInGroup ? "rounded-2xl rounded-bl-lg" : "rounded-2xl"}`
                                }`}
                              >
                                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                                  <span className={`text-[10px] ${
                                    isMe ? "text-primary-foreground/50" : "text-muted-foreground"
                                  }`}>
                                    {format(new Date(msg.created_at), "h:mm a")}
                                  </span>
                                  {isMe && (
                                    msg.read
                                      ? <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
                                      : <Check className="h-3.5 w-3.5 text-primary-foreground/40" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isOtherTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="flex justify-start mb-3"
                      >
                        <div className="bg-card border border-border rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Video upgrade nudge */}
                  {!isPremium && messages.length >= 5 && (
                    <div className="flex justify-center my-5">
                      <button
                        onClick={() => setVideoUpgradeOpen(true)}
                        className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 px-5 py-3.5 text-center transition-all hover:shadow-md hover:border-primary/30 max-w-xs"
                      >
                        <p className="text-sm font-medium text-foreground">💡 Ready to take this further?</p>
                        <p className="text-xs text-primary mt-1">🎥 Video calls are included in Annual</p>
                      </button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ──── Input / Locked ──── */}
              {isLocked ? (
                <div className="border-t border-border bg-card p-6">
                  <div className="mx-auto max-w-md text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {isMutualMatch ? "Daily message limit reached" : "You've reached your free message limit"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                      {isMutualMatch
                        ? `You've sent ${FREE_DAILY_MESSAGE_LIMIT} messages today. Upgrade for unlimited messaging, or come back tomorrow!`
                        : `Upgrade to continue chatting with ${selectedMatch.other_user.full_name.split(" ")[0]} and unlock unlimited messaging.`}
                    </p>
                    <Button
                      variant="hero"
                      size="sm"
                      className="gap-1.5 rounded-full px-6"
                      onClick={() => navigate("/premium")}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border bg-card">
                  {!isPremium && remainingFree !== Infinity && (
                    <div className="flex items-center justify-between px-4 py-1.5 bg-muted/40 border-b border-border">
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
                    <div className="mx-auto max-w-2xl flex items-center gap-2.5">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="w-full rounded-full border border-input bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value.slice(0, 1000))}
                          onKeyDown={handleKeyDown}
                          maxLength={1000}
                        />
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="flex h-11 w-11 items-center justify-center rounded-full gradient-hero text-primary-foreground shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ──── Empty state ──── */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="h-20 w-20 rounded-full bg-primary/8 flex items-center justify-center mb-5">
                <MessageCircle className="h-9 w-9 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                Choose a match from the list to start chatting
              </p>
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
