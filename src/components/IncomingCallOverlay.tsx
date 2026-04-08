import { useEffect } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { IncomingCall } from "@/hooks/useIncomingCall";

interface IncomingCallOverlayProps {
  call: IncomingCall | null;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallOverlay = ({ call, onAccept, onDecline }: IncomingCallOverlayProps) => {
  // Preload the Daily SDK as soon as the incoming call overlay appears
  useEffect(() => {
    if (call) {
      import("@daily-co/daily-js").catch(() => {});
    }
  }, [call]);

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 inset-x-0 mx-auto z-[100] w-[90vw] max-w-sm"
        >
          <div className="rounded-2xl bg-card border border-border shadow-2xl p-5 flex flex-col items-center gap-4">
            {/* Pulsing ring animation */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                <Video className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Incoming Video Call
              </p>
              <p className="text-sm text-muted-foreground">
                {call.caller_name || "Someone"} is calling you…
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <Button
                variant="destructive"
                className="flex-1 gap-2 rounded-full h-12"
                onClick={onDecline}
              >
                <PhoneOff className="h-5 w-5" />
                Decline
              </Button>
              <Button
                variant="default"
                className="flex-1 gap-2 rounded-full h-12 bg-green-600 hover:bg-green-700 text-white"
                onClick={onAccept}
              >
                <Phone className="h-5 w-5" />
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallOverlay;
