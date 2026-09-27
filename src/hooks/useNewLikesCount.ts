import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LAST_VISIT_KEY = "who_liked_me_last_visit";

function getLastVisit(userId: string): string {
  const stored = localStorage.getItem(`${LAST_VISIT_KEY}_${userId}`);
  return stored || new Date(0).toISOString();
}

export function markLikesVisited(userId: string) {
  localStorage.setItem(`${LAST_VISIT_KEY}_${userId}`, new Date().toISOString());
}

export function useNewLikesCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["new-likes-count", user?.id],
    queryFn: async () => {
      const lastVisit = getLastVisit(user!.id);
      const { count, error } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("liked_id", user!.id)
        .gt("created_at", lastVisit);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // poll every 30s
  });

  // Realtime subscription for new likes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`new-likes-count-${user.id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
          filter: `liked_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["new-likes-count", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return count;
}
