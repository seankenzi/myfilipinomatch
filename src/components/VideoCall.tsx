import { useState, useRef, useEffect, useCallback } from "react";
import Daily, { type DailyCall, type DailyParticipant } from "@daily-co/daily-js";
import { VideoOff, Video, PhoneOff, Loader2, Crown, Clock, WifiOff, Mic, MicOff, User, LayoutGrid, Maximize } from "lucide-react";
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
  joinRoomUrl?: string;
}

/** Extract base room URL (without query params) and token from a full Daily URL */
const parseDailyUrl = (fullUrl: string): { url: string; token?: string } => {
  try {
    const u = new URL(fullUrl);
    const token = u.searchParams.get("t") || undefined;
    u.search = "";
    return { url: u.toString().replace(/\/$/, ""), token };
  } catch {
    return { url: fullUrl };
  }
};

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/** Attach a MediaStreamTrack to a <video> or <audio> element */
const attachTrack = (
  el: HTMLVideoElement | HTMLAudioElement | null,
  track: MediaStreamTrack | null | undefined
) => {
  if (!el) return;
  if (!track) {
    el.srcObject = null;
    return;
  }
  // Avoid re-attaching the same track
  const existing = el.srcObject as MediaStream | null;
  if (existing?.getTracks()[0]?.id === track.id) return;
  el.srcObject = new MediaStream([track]);
};

const VideoCall = ({ matchId, otherUserName, open, onClose, joinRoomUrl }: VideoCallProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dailyCallRef = useRef<DailyCall | null>(null);
  const localDisplayNameRef = useRef("You");

  // Video / audio element refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Helper: destroy the Daily call object instance
  const destroyCallFrame = useCallback(() => {
    const cf = dailyCallRef.current;
    dailyCallRef.current = null;
    if (cf && !cf.isDestroyed()) {
      void cf.destroy().catch(() => undefined);
    }
  }, []);

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
  const RECONNECT_TIMEOUT_MS = 30000;
  const [callEstablished, setCallEstablished] = useState(false);
  const remainingSecondsRef = useRef(7200);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);
  const [isGridMode, setIsGridMode] = useState(false);

  const closeUi = useCallback(
    (toastMessage?: { title: string; description?: string }) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

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
      setRemoteVideoOff(false);
      setIsGridMode(false);
      destroyCallFrame();

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
    [destroyCallFrame, onClose, toast]
  );

  const fetchLocalDisplayName = useCallback(async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const metadataName =
        typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const emailFallback = user?.email?.split("@")[0]?.trim() ?? "";
      const fallbackName = metadataName || emailFallback || "You";
      if (!user) return fallbackName;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const profileName =
        typeof profile?.full_name === "string" ? profile.full_name.trim() : "";
      return profileName || fallbackName;
    } catch {
      return "You";
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionId || joinRoomUrl) return;
    let duration = callStartTimeRef.current > 0
      ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
      : 0;
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
      let { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData?.session?.access_token;
      if (!token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed?.session?.access_token;
      }

      if (!token) {
        setError("Please log in to make video calls.");
        setLoading(false);
        return;
      }

      if (joinRoomUrl) {
        setRoomUrl(joinRoomUrl);
        remainingSecondsRef.current = 7200;
        setRemainingSeconds(7200);
        setElapsedSeconds(0);
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

      let data = await res.json();

      if (res.status === 401) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const newToken = refreshed?.session?.access_token;
        if (newToken) {
          const retryRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/daily-video`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ match_id: matchId }),
            }
          );
          data = await retryRes.json();
          if (!retryRes.ok) {
            setError(data.error || "Failed to start video call");
            setLoading(false);
            return;
          }
        } else {
          setError("Session expired. Please log in again.");
          setLoading(false);
          return;
        }
      } else if (!res.ok) {
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

      const fullUrl = data.token
        ? `${data.room_url}${data.room_url.includes("?") ? "&" : "?"}t=${encodeURIComponent(data.token)}`
        : data.room_url;
      setRoomUrl(fullUrl);
      setSessionId(data.session_id);
      remainingSecondsRef.current = data.remaining_seconds || 7200;
      setRemainingSeconds(data.remaining_seconds || 7200);
      setElapsedSeconds(0);
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

  /** Sync tracks from a Daily participant to video/audio elements */
  const syncTracks = useCallback((participant: DailyParticipant) => {
    if (participant.local) {
      const vTrack = participant.tracks?.video?.persistentTrack;
      attachTrack(localVideoRef.current, participant.video ? vTrack : null);
    } else {
      const vTrack = participant.tracks?.video?.persistentTrack;
      const aTrack = participant.tracks?.audio?.persistentTrack;
      attachTrack(remoteVideoRef.current, participant.video ? vTrack : null);
      attachTrack(remoteAudioRef.current, participant.audio ? aTrack : null);
    }
  }, []);

  // Create the Daily call object when roomUrl is available
  useEffect(() => {
    if (!open || !roomUrl) return;

    // Clean up any previous instance
    destroyCallFrame();

    const isCaller = !joinRoomUrl;
    const { url, token } = parseDailyUrl(roomUrl);

    const callFrame = Daily.createCallObject({
      videoSource: true,
      audioSource: true,
    });

    dailyCallRef.current = callFrame;

    /** Safely run a Daily operation; show a toast on unexpected errors */
    const safeDailyOp = async (op: () => unknown) => {
      try {
        if (callFrame.isDestroyed()) return;
        await op();
      } catch (err: any) {
        if (err?.message?.includes("postMessage") || callFrame.isDestroyed()) return;
        console.warn("Daily operation failed:", err);
        toast({
          title: "Video call issue",
          description: "A minor issue occurred. The call should continue normally.",
          variant: "destructive",
        });
      }
    };

    callFrame.on("joined-meeting", () => {
      // Run all quality settings in parallel (non-blocking)
      void Promise.allSettled([
        callFrame.updateInputSettings({
          video: {
            processor: { type: 'none' as const },
            settings: {
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 },
              frameRate: { ideal: 30 },
            },
          },
        }).catch((e) => console.warn("Failed to set HD input settings:", e)),
        callFrame.updateSendSettings({
          video: {
            maxQuality: 'high',
            encodings: {
              low: { maxBitrate: 200000, maxFramerate: 15 },
              high: { maxBitrate: 2500000, maxFramerate: 30 },
            },
          },
        }).catch((e) => console.warn("Failed to set send settings:", e)),
        callFrame.updateReceiveSettings({
          '*': { video: { layer: 2 } },
        }).catch((e) => console.warn("Failed to set receive settings:", e)),
      ]);
      // Sync local tracks after joining
      const localP = callFrame.participants()?.local;
      if (localP) syncTracks(localP);
    });

    // Track start/stop events — attach/detach media
    callFrame.on("track-started", (event) => {
      if (event?.participant) syncTracks(event.participant);
    });

    callFrame.on("track-stopped", (event) => {
      if (event?.participant) syncTracks(event.participant);
    });

    // Handle remote participant joining -> start timer
    callFrame.on("participant-joined", (event) => {
      if (event?.participant?.local) return;
      setCallEstablished(true);
      callStartTimeRef.current = Date.now();
      setElapsedSeconds(0);

      // Sync their tracks
      syncTracks(event.participant);

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
    });

    // When remote participant leaves
    callFrame.on("participant-left", (event) => {
      if (event?.participant?.local) return;
      attachTrack(remoteVideoRef.current, null);
      attachTrack(remoteAudioRef.current, null);
      setRemoteVideoOff(true);
    });

    // Sync local media state when it changes
    callFrame.on("participant-updated", (event) => {
      if (!event?.participant) return;
      syncTracks(event.participant);

      if (event.participant.local) {
        setIsMuted(!event.participant.audio);
        setIsCameraOff(!event.participant.video);
      } else {
        setRemoteVideoOff(!event.participant.video);
      }
    });

    // Catch any unhandled Daily errors gracefully
    callFrame.on("error", (event) => {
      console.error("Daily error event:", event);
      if (isClosingRef.current) return;
      toast({
        title: "Video call error",
        description: "Something went wrong with the video call. Please try again.",
        variant: "destructive",
      });
      isClosingRef.current = true;
      void endSession();
      closeUi();
    });

    // Network connection monitoring via Daily events
    callFrame.on("network-connection", (event: any) => {
      const connType = event?.type as string;
      if (connType === "disconnected") {
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
      } else if (connType === "connected") {
        setConnectionLost(false);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        toast({ title: "Reconnected", description: "Your connection has been restored." });
      }
    });

    callFrame.on("left-meeting", () => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      void endSession();
      closeUi({ title: "Call ended", description: "You were disconnected from the call." });
    });

    // Join the room
    let isCancelled = false;
    void (async () => {
      // Start fetching display name and joining in parallel
      const displayNamePromise = fetchLocalDisplayName();

      const joinOpts: {
        url: string;
        token?: string;
        userName?: string;
      } = {
        url,
        userName: localDisplayNameRef.current,
      };
      if (token) joinOpts.token = token;

      // Resolve display name — use it if ready before join, otherwise update after
      displayNamePromise.then((name) => {
        localDisplayNameRef.current = name;
        joinOpts.userName = name;
      }).catch(() => {});

      try {
        if (isCancelled || callFrame.isDestroyed()) return;
        // Brief wait for display name (max 200ms), then join regardless
        await Promise.race([displayNamePromise, new Promise((r) => setTimeout(r, 200))]);
        joinOpts.userName = localDisplayNameRef.current;

        await callFrame.join(joinOpts);
      } catch (err: any) {
        if (err?.message?.includes("postMessage") || callFrame.isDestroyed()) return;
        console.error("Daily join error:", err);
        toast({
          title: "Failed to join call",
          description: "Something went wrong connecting to the video call. Please try again.",
          variant: "destructive",
        });
        if (!isClosingRef.current) {
          isClosingRef.current = true;
          closeUi();
        }
      }
    })();

    return () => {
      isCancelled = true;
      destroyCallFrame();
    };
  }, [open, roomUrl, fetchLocalDisplayName]);

  // Browser online/offline listeners
  useEffect(() => {
    if (!open || !roomUrl) return;

    const handleOnline = () => {
      setConnectionLost(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const handleOffline = () => {
      if (isClosingRef.current) return;
      setConnectionLost(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [open, roomUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      destroyCallFrame();
    };
  }, [destroyCallFrame]);

  const timeRemaining = Math.max(0, remainingSeconds - elapsedSeconds);
  const isLowTime = timeRemaining <= 300;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden rounded-xl">
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
          <div className={`relative h-full w-full overflow-hidden bg-black ${isGridMode ? "flex flex-col md:flex-row" : ""}`}>
            {isGridMode ? (
              /* ── Grid mode: side-by-side (desktop) ── */
              <>
                {/* Remote video tile */}
                <div className="relative flex-1 h-full bg-black">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {(!callEstablished || remoteVideoOff) && !connectionLost && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 backdrop-blur-sm">
                          <User className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium text-white drop-shadow-md">
                          {callEstablished ? `${otherUserName}'s camera is off` : `Waiting for ${otherUserName}…`}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    {otherUserName}
                  </div>
                </div>

                {/* Local video tile */}
                <div className="relative flex-1 h-full bg-black border-l-2 border-white/10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
                      <User className="h-10 w-10 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Camera off</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    You
                  </div>
                </div>
              </>
            ) : (
              /* ── PiP mode: remote fullscreen, local small ── */
              <>
                {/* Remote video — fullscreen */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Waiting / no remote video */}
                {(!callEstablished || remoteVideoOff) && !connectionLost && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/30 backdrop-blur-sm">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <span className="text-base font-medium text-white drop-shadow-md">
                        {callEstablished ? `${otherUserName}'s camera is off` : `Waiting for ${otherUserName}…`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Local video — small PiP in bottom-right */}
                <div className="absolute bottom-24 right-4 z-20 w-28 h-40 sm:w-32 sm:h-44 rounded-xl overflow-hidden shadow-xl border-2 border-white/20 bg-black">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
                      <User className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Camera off</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Remote audio */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Connection lost overlay */}
            {connectionLost && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
                <WifiOff className="h-10 w-10 text-destructive animate-pulse" />
                <p className="text-sm font-medium text-foreground">Connection lost</p>
                <p className="text-xs text-muted-foreground">Attempting to reconnect…</p>
              </div>
            )}

            {/* Timer overlay */}
            {!joinRoomUrl && (
              callEstablished ? (
                <div
                  className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm ${
                    isLowTime
                      ? "bg-destructive/90 text-destructive-foreground animate-pulse"
                      : "bg-card/80 text-foreground"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(timeRemaining)}
                </div>
              ) : (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm bg-card/80 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for {otherUserName}…
                </div>
              )
            )}

            {/* Floating controls */}
            <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4">
              <div className="flex max-w-full items-center gap-3 rounded-full border border-border/40 bg-foreground/55 px-4 py-3 shadow-lg backdrop-blur-md">
                <Button
                  variant={isMuted ? "secondary" : "outline"}
                  size="icon"
                  className={`h-12 w-12 rounded-full shadow-lg ${
                    isMuted ? "bg-muted/90 text-destructive" : "bg-card/80 text-foreground"
                  }`}
                  onClick={() => {
                    const cf = dailyCallRef.current;
                    if (cf && !cf.isDestroyed()) {
                      const nextAudio = !cf.localAudio();
                      cf.setLocalAudio(nextAudio);
                      setIsMuted(!nextAudio);
                    }
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
                    const cf = dailyCallRef.current;
                    if (cf && !cf.isDestroyed()) {
                      const nextVideo = !cf.localVideo();
                      cf.setLocalVideo(nextVideo);
                      setIsCameraOff(!nextVideo);
                    }
                  }}
                >
                  {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>

                {/* Grid/PiP toggle — desktop only */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg bg-card/80 text-foreground"
                  onClick={() => setIsGridMode((prev) => !prev)}
                  title={isGridMode ? "Switch to spotlight" : "Switch to grid"}
                >
                  {isGridMode ? <Maximize className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
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
