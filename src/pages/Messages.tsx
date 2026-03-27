import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ArrowLeft, Shield, Lock, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";

interface Match {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    photos: string[] | null;
    is_verified: boolean | null;
  };
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

  // Fetch matches with last message
  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);

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

    const otherUserIds = matchesData.map((m) =>
      m.user1_id === user.id ? m.user2_id : m.user1_id
    );

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, photos, is_verified")
      .in("id", otherUserIds);

    const profileMap = new Map(
      (profilesData || []).map((p) => [p.id, p])
    );

    // Fetch last message for each match
    const matchList: Match[] = [];
    for (const m of matchesData) {
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
        other_user: profile,
        last_message: lastMsg || undefined,
        unread_count: count || 0,
      });
    }

    // Sort: unread first, then by last message time
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

  // Fetch messages for selected match
  const fetchMessages = useCallback(async () => {
    if (!selectedMatch || !user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", selectedMatch.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);

      // Mark unread messages as read
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedMatch) return;

    const channel = supabase
      .channel(`messages-${selectedMatch.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${selectedMatch.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedMatch || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
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

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.created_at);
    let label: string;
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else label = format(date, "MMMM d, yyyy");

    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup?.date === label) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: label, messages: [msg] });
    }
  });

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
            <p className="text-xs text-muted-foreground mt-0.5">{matches.length} conversation{matches.length !== 1 ? "s" : ""}</p>
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm truncate ${match.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                          {match.other_user.full_name}
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
        <div
          className={`flex-1 flex flex-col ${
            selectedMatch ? "flex" : "hidden md:flex"
          }`}
        >
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
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-semibold text-sm">{selectedMatch.other_user.full_name}</h2>
                    {selectedMatch.other_user.is_verified && (
                      <Shield className="h-3.5 w-3.5 text-secondary fill-secondary/30" />
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mx-auto max-w-2xl space-y-1">
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
                            <p
                              className={`mt-1 text-[10px] ${
                                msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"
                              }`}
                            >
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-border bg-card p-3">
                <div className="mx-auto max-w-2xl flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
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

      <BottomNav />
    </div>
  );
};

export default Messages;