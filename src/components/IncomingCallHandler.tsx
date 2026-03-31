import { useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import IncomingCallOverlay from "@/components/IncomingCallOverlay";

const VideoCallLazy = lazy(() => import("@/components/VideoCall"));

const IncomingCallHandler = () => {
  const navigate = useNavigate();
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const [acceptedCall, setAcceptedCall] = useState<{
    matchId: string;
    roomUrl: string;
    callerName: string;
  } | null>(null);

  const handleAccept = async () => {
    const call = await acceptCall();
    if (call?.room_url) {
      setAcceptedCall({
        matchId: call.match_id,
        roomUrl: call.room_url,
        callerName: call.caller_name || "Someone",
      });
    } else if (call) {
      navigate(`/messages?match=${call.match_id}&openVideo=1`);
    }
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
