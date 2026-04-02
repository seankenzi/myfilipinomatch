import { useState, useRef, useEffect, useCallback } from "react";
import { VideoOff, Video, PhoneOff, Loader2, Crown, Clock, WifiOff, Mic, MicOff } from "lucide-react";
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

const DAILY_EMBED_PARAMS: Record<string, string> = {
  prejoin: "false",
  showParticipantsBar: "false",
  showUserNameChangeUI: "false",
  showLeaveButton: "false",
  showFullscreenButton: "false",
  showLocalVideo: "true",
  showChat: "false",
  activeSpeakerMode: "false",
  showHeader: "false",
  showControls: "false",
  enable_prejoin_ui: "false",
  enable_people_ui: "false",
  enable_network_ui: "false",
};

const DAILY_IFRAME_CROP = {
  top: 0,
  bottom: 80,
};

const buildDailyEmbedUrl = (baseUrl: string, token?: string) => {
  try {
    const url = new URL(baseUrl);
    if (token) url.searchParams.set("t", token);
    Object.entries(DAILY_EMBED_PARAMS).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    const withToken = token
      ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}t=${encodeURIComponent(token)}`
      : baseUrl;
    const params = new URLSearchParams(DAILY_EMBED_PARAMS).toString();
    return `${withToken}${withToken.includes("?") ? "&" : "?"}${params}`;
  }
};

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
  const isClosingRef = useRef(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const RECONNECT_TIMEOUT_MS = 30000; // 30s before giving up
  const [callEstablished, setCallEstablished] = useState(false);
  const remainingSecondsRef = useRef(7200);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const closeUi = useCallback(
    (toastMessage?: { title: string; description?: string }) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Build duration summary
      const duration = callStartTimeRef.current > 0
        ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
        : 0;
      const durationText = duration > 0 ? `Call lasted ${formatTime(duration)}` : undefined;

      setRoomUrl(null);
      setError(null);
      setNeedsUpgrade(false);
      setLimitReached(false);
      setElapsedSeconds(0);
      setCallEstablished(false);
      setIsMuted(false);
      setIsCameraOff(false);

      if (toastMessage) {
        toast({
          ...toastMessage,
          description: [toastMessage.description, durationText].filter(Boolean).join(" · "),
        });
      } else if (durationText) {
        toast({ title: "Call ended", description: durationText });
      }

      onClose();
    },
    [onClose, toast]
  );

  const endSession = useCallback(async () => {
    // Only the caller (initiator) has a session to end
    if (!sessionId || joinRoomUrl) return;
    let duration = callStartTimeRef.current > 0
      ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
      : 0;
    // Safety cap: never report more than 2 hours
    duration = Math.min(duration, 7200);
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
  }, [sessionId, joinRoomUrl]);

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
        setRoomUrl(buildDailyEmbedUrl(joinRoomUrl));
        remainingSecondsRef.current = 7200;
        setRemainingSeconds(7200);
        setElapsedSeconds(0);
        // Timer will start when "participant-joined" is received from Daily
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

      setRoomUrl(buildDailyEmbedUrl(data.room_url, data.token));
      setSessionId(data.session_id);
      remainingSecondsRef.current = data.remaining_seconds || 7200;
      setRemainingSeconds(data.remaining_seconds || 7200);
      setElapsedSeconds(0);
      // Timer will start when "participant-joined" is received from Daily
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

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      setCallEstablished(false);
    }
  }, [open]);

  

  // Listen for signal status changes (ended, declined, missed)
  const channelIdRef = useRef(0);
  useEffect(() => {
    if (!open) return;

    const thisChannelId = ++channelIdRef.current;
    const channel = supabase
      .channel(`call-signal-${matchId}-${thisChannelId}-${Date.now()}`)
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
            if (isClosingRef.current) return;
            isClosingRef.current = true;
            void endSession();
            closeUi({ title: "Call ended", description: `${otherUserName} ended the call.` });
          } else if (status === "missed" && !joinRoomUrl) {
            if (isClosingRef.current) return;
            isClosingRef.current = true;
            closeUi({ title: "No answer", description: "They didn't pick up. Try again later." });
          } else if (status === "declined" && !joinRoomUrl) {
            if (isClosingRef.current) return;
            isClosingRef.current = true;
            closeUi({ title: "Call declined", description: "They're not available right now." });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, matchId, joinRoomUrl, otherUserName, endSession, closeUi]);

  // Fallback polling in case realtime update is missed
  useEffect(() => {
    if (!open || !roomUrl) return;

    let isCancelled = false;

    const checkSignalStatus = async () => {
      if (isCancelled || isClosingRef.current) return;

      const { data: latestSignal } = await supabase
        .from("video_call_signals")
        .select("status")
        .eq("match_id", matchId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestSignal || isCancelled || isClosingRef.current) return;

      if (latestSignal.status === "ended") {
        isClosingRef.current = true;
        void endSession();
        closeUi({ title: "Call ended", description: `${otherUserName} ended the call.` });
      } else if (latestSignal.status === "missed" && !joinRoomUrl) {
        isClosingRef.current = true;
        closeUi({ title: "No answer", description: "They didn't pick up. Try again later." });
      } else if (latestSignal.status === "declined" && !joinRoomUrl) {
        isClosingRef.current = true;
        closeUi({ title: "Call declined", description: "They're not available right now." });
      }
    };

    void checkSignalStatus();
    const pollId = setInterval(() => {
      void checkSignalStatus();
    }, 2000);

    return () => {
      isCancelled = true;
      clearInterval(pollId);
    };
  }, [open, roomUrl, matchId, joinRoomUrl, otherUserName, endSession, closeUi]);

  const handleClose = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Update signal to "ended" FIRST so the other participant gets notified
    try {
      const { data: signals } = await supabase
        .from("video_call_signals")
        .select("id")
        .eq("match_id", matchId)
        .in("status", ["ringing", "accepted"]);

      if (signals && signals.length > 0) {
        for (const signal of signals) {
          await supabase
            .from("video_call_signals")
            .update({ status: "ended", updated_at: new Date().toISOString() })
            .eq("id", signal.id);
        }
      }
    } catch (e) {
      console.error("Error updating call signal:", e);
    }

    await endSession();
    closeUi();
  }, [endSession, closeUi, matchId]);

  // Start timer only when a second participant joins (call is truly established)
  // Start timer only when a second participant joins (call is truly established)
  // Usage limits (countdown, warnings, auto-hangup) only apply to the caller (initiator)
  useEffect(() => {
    if (!open || !roomUrl) return;

    const isCaller = !joinRoomUrl;

    const handleDailyMessage = (event: MessageEvent) => {
      if (typeof event.data !== "object" || !event.data?.action) return;
      const action = event.data.action as string;

      // "participant-joined" fires when the OTHER person joins the room
      if (action === "participant-joined" && !event.data?.participant?.local) {
        if (callEstablished) return;
        setCallEstablished(true);
        callStartTimeRef.current = Date.now();
        setElapsedSeconds(0);

        // Only run the usage countdown timer for the caller (initiator)
        if (isCaller) {
          if (timerRef.current) clearInterval(timerRef.current);
          const maxSeconds = remainingSecondsRef.current;
          timerRef.current = setInterval(() => {
            setElapsedSeconds((prev) => {
              const next = prev + 1;
              if (next >= maxSeconds) {
                handleClose();
                toast({
                  title: "Time's up!",
                  description: "You've used your 2 free video call hours this month.",
                });
              }
              if (maxSeconds - next === 300) {
                toast({
                  title: "⏰ 5 minutes remaining",
                  description: "Your monthly video call time is almost up.",
                });
              }
              return next;
            });
          }, 1000);
        }
      }
    };

    window.addEventListener("message", handleDailyMessage);
    return () => window.removeEventListener("message", handleDailyMessage);
  }, [open, roomUrl, callEstablished, toast, handleClose, joinRoomUrl]);

  // Monitor connection health via Daily postMessage events & online status
  useEffect(() => {
    if (!open || !roomUrl) return;

    const handleOnline = () => {
      if (!connectionLost) return;
      setConnectionLost(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      toast({ title: "Reconnected", description: "Your connection has been restored." });
    };

    const handleOffline = () => {
      if (isClosingRef.current) return;
      setConnectionLost(true);
      toast({
        title: "Connection lost",
        description: "Trying to reconnect… The call will end if connection isn't restored in 30 seconds.",
        variant: "destructive",
      });
      reconnectTimerRef.current = setTimeout(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        void endSession();
        closeUi({
          title: "Call disconnected",
          description: "The connection couldn't be restored. Please try calling again.",
        });
      }, RECONNECT_TIMEOUT_MS);
    };

    // Listen for Daily iframe error events
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "object" || !event.data?.action) return;
      const action = event.data.action as string;

      if (action === "error" || action === "network-connection") {
        if (event.data?.errorMsg?.includes("disconnected") || event.data?.type === "disconnected") {
          handleOffline();
        } else if (event.data?.type === "connected") {
          handleOnline();
        }
      }

      // Daily sends "left-meeting" when participant is kicked/disconnected
      if (action === "left-meeting" && !isClosingRef.current) {
        isClosingRef.current = true;
        void endSession();
        closeUi({ title: "Call ended", description: "You were disconnected from the call." });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("message", handleMessage);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [open, roomUrl, connectionLost, endSession, closeUi, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
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
          <div className="relative h-full w-full overflow-hidden bg-foreground">
            <iframe
              ref={iframeRef}
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture"
              className="absolute left-0 right-0 w-full border-0 bg-foreground"
              style={{
                top: `-${DAILY_IFRAME_CROP.top}px`,
                height: `calc(100% + ${DAILY_IFRAME_CROP.top + DAILY_IFRAME_CROP.bottom}px)`,
              }}
              title={`Video call with ${otherUserName}`}
            />

            {/* Fallback masks for stubborn Daily UI strips */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-foreground via-foreground to-transparent"
              style={{ height: DAILY_IFRAME_CROP.top + 48 }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 z-20 hidden md:block bg-gradient-to-bl from-foreground via-foreground to-transparent"
              style={{
                height: DAILY_IFRAME_CROP.topRightHeight,
                width: DAILY_IFRAME_CROP.topRightWidth,
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-foreground via-foreground to-transparent"
              style={{ height: DAILY_IFRAME_CROP.bottom + 32 }}
            />

            {/* Connection lost overlay */}
            {connectionLost && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
                <WifiOff className="h-10 w-10 text-destructive animate-pulse" />
                <p className="text-sm font-medium text-foreground">Connection lost</p>
                <p className="text-xs text-muted-foreground">Attempting to reconnect…</p>
              </div>
            )}

            {/* Timer overlay - only show for the caller (initiator), not the callee */}
            {!joinRoomUrl && (
              callEstablished ? (
                <div
                  className={`absolute top-14 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm ${
                    isLowTime
                      ? "bg-destructive/90 text-destructive-foreground animate-pulse"
                      : "bg-card/80 text-foreground"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(timeRemaining)}
                </div>
              ) : (
                <div className="absolute top-14 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm bg-card/80 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for {otherUserName}…
                </div>
              )
            )}

            {/* Floating controls - keeps Daily's toolbar hidden without creating white bars */}
            <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4">
              <div className="flex max-w-full items-center gap-3 rounded-full border border-border/40 bg-foreground/55 px-4 py-3 shadow-lg backdrop-blur-md">
                <Button
                  variant={isMuted ? "secondary" : "outline"}
                  size="icon"
                  className={`h-12 w-12 rounded-full shadow-lg ${
                    isMuted ? "bg-muted/90 text-destructive" : "bg-card/80 text-foreground"
                  }`}
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage({ action: "toggle-audio" }, "*");
                    setIsMuted((prev) => !prev);
                  }}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg"
                  onClick={handleClose}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>

                <Button
                  variant={isCameraOff ? "secondary" : "outline"}
                  size="icon"
                  className={`h-12 w-12 rounded-full shadow-lg ${
                    isCameraOff ? "bg-muted/90 text-destructive" : "bg-card/80 text-foreground"
                  }`}
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage({ action: "toggle-video" }, "*");
                    setIsCameraOff((prev) => !prev);
                  }}
                >
                  {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
