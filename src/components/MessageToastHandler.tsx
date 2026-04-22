import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Global handler that pops up a toast whenever the user receives a new chat message,
 * regardless of which page they're on. Suppressed when they're already viewing the
 * relevant conversation in /messages.
 */
const MessageToastHandler = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`message-toasts-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n: any = payload.new;
          if (!n || n.type !== "message") return;

          // Suppress if user is already in /messages viewing this match/dm
          const isOnMessages = location.pathname === "/messages";
          const params = new URLSearchParams(location.search);
          const activeMatch = params.get("match");
          const activeDm = params.get("dm");
          if (
            isOnMessages &&
            (activeMatch === n.related_match_id || activeDm === n.related_match_id)
          ) {
            return;
          }

          toast(n.title || "New Message 💬", {
            description: n.body || "You received a new message.",
            icon: <MessageCircle className="h-4 w-4" />,
            action: {
              label: "Open",
              onClick: () => {
                if (n.related_match_id) {
                  navigate(`/messages?match=${n.related_match_id}`);
                } else {
                  navigate("/messages");
                }
              },
            },
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, location.pathname, location.search, navigate]);

  return null;
};

export default MessageToastHandler;
