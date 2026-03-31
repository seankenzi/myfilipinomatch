import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface IncomingCall {
  id: string;
  match_id: string;
  caller_id: string;
  callee_id: string;
  room_url: string | null;
  status: string;
  caller_name?: string;
  caller_avatar?: string;
}

export const useIncomingCall = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Fetch caller profile info
  const enrichCall = useCallback(async (call: IncomingCall) => {
    const { data } = await supabase.rpc("get_profile_by_id", { profile_id: call.caller_id });
    if (data && data.length > 0) {
      call.caller_name = data[0].full_name;
      call.caller_avatar = data[0].avatar_url ?? undefined;
    }
    return call;
  }, []);

  // Check for any existing ringing call on mount
  useEffect(() => {
    if (!user) return;

    const checkExisting = async () => {
      const { data } = await supabase
        .from("video_call_signals")
        .select("*")
        .eq("callee_id", user.id)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const enriched = await enrichCall(data[0] as IncomingCall);
        setIncomingCall(enriched);
      }
    };
    checkExisting();
  }, [user, enrichCall]);

  // Listen for realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("incoming-call-signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as IncomingCall;
          if (call.status === "ringing") {
            const enriched = await enrichCall(call);
            setIncomingCall(enriched);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as IncomingCall;
          if (updated.status !== "ringing") {
            setIncomingCall((prev) => (prev?.id === updated.id ? null : prev));
          }
        }
      )
      // Also listen for caller cancelling
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "video_call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        () => {
          setIncomingCall(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, enrichCall]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return null;
    await supabase
      .from("video_call_signals")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
    const call = { ...incomingCall };
    setIncomingCall(null);
    return call;
  }, [incomingCall]);

  const declineCall = useCallback(async () => {
    if (!incomingCall) return;
    await supabase
      .from("video_call_signals")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
    setIncomingCall(null);
  }, [incomingCall]);

  return { incomingCall, acceptCall, declineCall };
};
