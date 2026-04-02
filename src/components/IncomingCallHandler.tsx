import { useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import IncomingCallOverlay from "@/components/IncomingCallOverlay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VideoCallLazy = lazy(() => import("@/components/VideoCall"));

const IncomingCallHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const [acceptedCall, setAcceptedCall] = useState<{
    matchId: string;
    roomUrl: string;
    callerName: string;
  } | null>(null);

  const handleAccept = async () => {
    const call = await acceptCall();
    if (!call) return;

    // Get a unique token for the callee via the join action
    try {
      let { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData?.session?.access_token;

      // Refresh if missing
      if (!token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed?.session?.access_token;
      }

      if (!token) {
        navigate(`/messages?match=${call.match_id}&openVideo=1`);
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const doJoin = async (authToken: string) =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/daily-video?action=join`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ match_id: call.match_id }),
          }
        );

      let res = await doJoin(token);

      // Retry once on 401
      if (res.status === 401) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const newToken = refreshed?.session?.access_token;
        if (newToken) {
          res = await doJoin(newToken);
        }
      }

      if (res.ok) {
        const data = await res.json();
        setAcceptedCall({
          matchId: call.match_id,
          roomUrl: data.full_room_url,
          callerName: call.caller_name || "Someone",
        });
        return;
      }
    } catch {
      // Fallback
    }

    // Fallback: navigate to messages
    navigate(`/messages?match=${call.match_id}&openVideo=1`);
  };

  return (
    <>
      <IncomingCallOverlay
        call={incomingCall}
        onAccept={handleAccept}
        onDecline={declineCall}
      />
      {acceptedCall && (
        <Suspense fallback={null}>
          <VideoCallLazy
            matchId={acceptedCall.matchId}
            otherUserName={acceptedCall.callerName}
            open={true}
            onClose={() => setAcceptedCall(null)}
            joinRoomUrl={acceptedCall.roomUrl}
          />
        </Suspense>
      )}
    </>
  );
};

export default IncomingCallHandler;
