import { useAppUpdateCheck } from "@/hooks/useAppUpdateCheck";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const AppUpdatePrompt = () => {
  const { updateInfo, dismiss } = useAppUpdateCheck();

  if (!updateInfo) return null;

  const handleUpdate = () => {
    if (updateInfo.storeUrl) {
      window.open(updateInfo.storeUrl, "_system");
    }
  };

  return (
    <Dialog open={true} onOpenChange={updateInfo.forceUpdate ? undefined : () => dismiss()}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={updateInfo.forceUpdate ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {updateInfo.forceUpdate ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            {updateInfo.forceUpdate ? "Update Required" : "Update Available"}
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              {updateInfo.forceUpdate
                ? "This version of the app is no longer supported. Please update to continue using MyFilipinoMatch."
                : `A new version (v${updateInfo.latestVersion}) is available! Update now for the latest features and improvements.`}
            </p>
            <p className="text-xs text-muted-foreground">
              Current version: v{updateInfo.currentVersion}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          {!updateInfo.forceUpdate && (
            <Button variant="ghost" onClick={dismiss}>
              Later
            </Button>
          )}
          <Button onClick={handleUpdate} className="gap-2">
            <Download className="h-4 w-4" />
            Update Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppUpdatePrompt;
