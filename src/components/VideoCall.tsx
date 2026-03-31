import { useState, useRef, useEffect, useCallback } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, Crown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface VideoCallProps {
  matchId: string;
  otherUserName: string;
  open: boolean;
  onClose: () => void;
  joinRoomUrl?: string; // If provided, skip room creation and join directly
}

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const VideoCall = ({ matchId, otherUserName, open, onClose, joinRoomUrl }: VideoCallProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  // Timer state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartTimeRef = useRef<number>(0);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    const duration = Math.round((Date.now() - callStartTimeRef.current) / 1000);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/daily-video?action=end-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ session_id: sessionId, duration_seconds: duration }),
        }
      );
    } catch {
      // Best effort
    }
    setSessionId(null);
  }, [sessionId]);

  const startCall = async () => {
    setLoading(true);
    setError(null);
    setNeedsUpgrade(false);
    setLimitReached(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setError("Please log in to make video calls.");
        setLoading(false);
        return;
      }

      // If joining an existing room (accepted incoming call), skip edge function
      if (joinRoomUrl) {
        const separator = joinRoomUrl.includes("?") ? "&" : "?";
        setRoomUrl(`${joinRoomUrl}${separator}prejoin=false`);
        setRemainingSeconds(7200);
        setElapsedSeconds(0);
        callStartTimeRef.current = Date.now();

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);

        setLoading(false);
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/daily-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ match_id: matchId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Failed to start video call";

        if (res.status === 429 || data.code === "MONTHLY_LIMIT_REACHED") {
          setLimitReached(true);
        } else if (res.status === 403 && message.includes("1-year")) {
          setNeedsUpgrade(true);
        } else if (message.toLowerCase().includes("payment method") || message.toLowerCase().includes("daily dashboard")) {
          setError("Video calling is configured, but the Daily account needs a payment method before calls can start.");
        } else {
          setError(message);
        }
        setLoading(false);
        return;
      }

      setRoomUrl(`${data.room_url}?t=${data.token}&prejoin=false`);
      setSessionId(data.session_id);
      setRemainingSeconds(data.remaining_seconds || 7200);
      setElapsedSeconds(0);
      callStartTimeRef.current = Date.now();

      // Signaling is now created server-side in the daily-video function

      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= (data.remaining_seconds || 7200)) {
            handleClose();
            toast({
              title: "Time's up!",
              description: "You've used your 2 free video call hours this month.",
            });
          }
          if ((data.remaining_seconds || 7200) - next === 300) {
            toast({
              title: "⏰ 5 minutes remaining",
              description: "Your monthly video call time is almost up.",
            });
          }
          return next;
        });
      }, 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && !roomUrl && !loading && !error && !needsUpgrade && !limitReached) {
      startCall();
    }
  }, [open]);

  // Listen for signal status changes (ended, declined, missed)
  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel(`call-signal-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_call_signals",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const status = (payload.new as any).status;
          if (status === "ended") {
            // Other participant ended the call
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            endSession();
            setRoomUrl(null);
            setElapsedSeconds(0);
            toast({ title: "Call ended", description: `${otherUserName} ended the call.` });
            onClose();
          } else if (status === "missed" && !joinRoomUrl) {
            toast({ title: "No answer", description: "They didn't pick up. Try again later." });
            onClose();
          } else if (status === "declined" && !joinRoomUrl) {
            toast({ title: "Call declined", description: "They're not available right now." });
            onClose();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, matchId, joinRoomUrl, toast, endSession, onClose, otherUserName]);

  const handleClose = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    endSession();
    // Clean up call signal
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase
          .from("video_call_signals")
          .update({ status: "ended", updated_at: new Date().toISOString() })
          .eq("match_id", matchId)
          .or(`caller_id.eq.${currentUser.id},callee_id.eq.${currentUser.id}`)
          .in("status", ["ringing", "accepted"]);
      }
    } catch {
      // Best effort cleanup
    }
    setRoomUrl(null);
    setError(null);
    setNeedsUpgrade(false);
    setLimitReached(false);
    setElapsedSeconds(0);
    onClose();
  }, [endSession, onClose, matchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timeRemaining = Math.max(0, remainingSeconds - elapsedSeconds);
  const isLowTime = timeRemaining <= 300; // 5 minutes

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting video call...</p>
          </div>
        )}

        {needsUpgrade && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="rounded-full bg-accent/10 p-4">
              <Crown className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Video Calls — Yearly Exclusive
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Video calling is available exclusively for 1-Year members.
              Upgrade now to connect face-to-face with your matches!
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="hero" onClick={() => { handleClose(); navigate("/premium"); }}>
                Upgrade to Yearly
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Maybe Later
              </Button>
            </div>
          </div>
        )}

        {limitReached && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Monthly Limit Reached
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You've used your 2 free hours of video calls this month.
              Your allowance resets at the beginning of next month.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Got it
            </Button>
          </div>
        )}

        {error && !needsUpgrade && !limitReached && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <VideoOff className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={startCall}>
              Try Again
            </Button>
          </div>
        )}

        {roomUrl && (
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full border-0"
              title={`Video call with ${otherUserName}`}
            />

            {/* Timer overlay */}
            <div
              className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm ${
                isLowTime
                  ? "bg-destructive/90 text-destructive-foreground animate-pulse"
                  : "bg-card/80 text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeRemaining)}
            </div>

            <Button
              variant="destructive"
              size="icon"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full shadow-lg"
              onClick={handleClose}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
