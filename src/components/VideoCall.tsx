import { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, Crown } from "lucide-react";
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
}

const VideoCall = ({ matchId, otherUserName, open, onClose }: VideoCallProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  const startCall = async () => {
    setLoading(true);
    setError(null);
    setNeedsUpgrade(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setError("Please log in to make video calls.");
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
        if (res.status === 403 && data.error?.includes("1-year")) {
          setNeedsUpgrade(true);
        } else {
          setError(data.error || "Failed to start video call");
        }
        setLoading(false);
        return;
      }

      setRoomUrl(`${data.room_url}?t=${data.token}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && !roomUrl && !loading && !error && !needsUpgrade) {
      startCall();
    }
  }, [open]);

  const handleClose = () => {
    setRoomUrl(null);
    setError(null);
    setNeedsUpgrade(false);
    onClose();
  };

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

        {error && !needsUpgrade && (
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
