import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Global handler that pops up a toast whenever the user receives a new chat message
 * (mutual match OR direct message), regardless of which page they're on.
 * Suppressed when they're already viewing the relevant conversation in /messages.
 */
const MessageToastHandler = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Cache match/dm participant lookups so we don't refetch repeatedly
  const matchCache = useRef<Map<string, { otherId: string }>>(new Map());
  const dmCache = useRef<Map<string, { initiator_id: string; recipient_id: string }>>(
    new Map()
  );
  const nameCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;

    const getSenderName = async (senderId: string): Promise<string> => {
      if (nameCache.current.has(senderId)) return nameCache.current.get(senderId)!;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", senderId)
        .maybeSingle();
      const name = (data?.full_name as string) || "Someone";
      nameCache.current.set(senderId, name);
      return name;
    };

    const isViewingConversation = (kind: "match" | "dm", id: string): boolean => {
      if (location.pathname !== "/messages") return false;
      const params = new URLSearchParams(location.search);
      return params.get(kind) === id;
    };

    const showToast = (
      senderName: string,
      content: string,
      openPath: string
    ) => {
      const preview = content.length > 100 ? `${content.slice(0, 100)}…` : content;
      toast(`💬 ${senderName}`, {
        description: preview,
        icon: <MessageCircle className="h-4 w-4" />,
        action: {
          label: "Open",
          onClick: () => navigate(openPath),
        },
        duration: 6000,
      });
    };

    // ---- Mutual match messages ----
    const matchChannel = supabase
      .channel(`toast-messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg: any = payload.new;
          if (!msg || msg.sender_id === user.id) return;

          // Resolve the match → confirm current user is a participant
          let cached = matchCache.current.get(msg.match_id);
          if (!cached) {
            const { data: match } = await supabase
              .from("matches")
              .select("user1_id,user2_id")
              .eq("id", msg.match_id)
              .maybeSingle();
            if (!match) return;
            const m: any = match;
            if (m.user1_id !== user.id && m.user2_id !== user.id) return;
            cached = { otherId: m.user1_id === user.id ? m.user2_id : m.user1_id };
            matchCache.current.set(msg.match_id, cached);
          }

          if (isViewingConversation("match", msg.match_id)) return;

          const senderName = await getSenderName(msg.sender_id);
          showToast(senderName, msg.content, `/messages?match=${msg.match_id}`);
        }
      )
      .subscribe();

    // ---- Direct messages ----
    const dmChannel = supabase
      .channel(`toast-dm-messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        async (payload) => {
          const msg: any = payload.new;
          if (!msg || msg.sender_id === user.id) return;

          let cached = dmCache.current.get(msg.conversation_id);
          if (!cached) {
            const { data: convo } = await supabase
              .from("dm_conversations")
              .select("initiator_id,recipient_id")
              .eq("id", msg.conversation_id)
              .maybeSingle();
            if (!convo) return;
            const c: any = convo;
            if (c.initiator_id !== user.id && c.recipient_id !== user.id) return;
            cached = { initiator_id: c.initiator_id, recipient_id: c.recipient_id };
            dmCache.current.set(msg.conversation_id, cached);
          }

          if (isViewingConversation("dm", msg.conversation_id)) return;

          const senderName = await getSenderName(msg.sender_id);
          showToast(senderName, msg.content, `/messages?dm=${msg.conversation_id}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(dmChannel);
    };
  }, [user, location.pathname, location.search, navigate]);

  return null;
};

export default MessageToastHandler;
