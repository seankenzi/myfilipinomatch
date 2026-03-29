import { Video, Crown, Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
}

const VideoCallModal = ({ open, onOpenChange, userName = "this person" }: VideoCallModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Video className="h-4 w-4 text-primary" />
            </div>
            🔒 Video Calls Locked
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              Want to connect with <span className="font-semibold text-foreground">{userName}</span> face-to-face? ❤️
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Video className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Get 2 FREE hours of video calls every month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                <span>See real reactions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-secondary flex-shrink-0" />
                <span>Avoid fake profiles</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Maybe later</Button>
          </DialogClose>
          <Button
            variant="hero"
            size="sm"
            className="gap-1.5"
            onClick={() => { onOpenChange(false); navigate("/premium"); }}
          >
            <Crown className="h-3.5 w-3.5" />
            Upgrade to Annual
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
