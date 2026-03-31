import { useEffect, useRef } from "react";
import { toast } from "sonner";

const useOnlineStatus = () => {
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      toast.error("You're offline", {
        description: "Check your internet connection. Some features may be unavailable.",
        duration: Infinity,
        id: "offline-toast",
      });
    };

    const handleOnline = () => {
      toast.dismiss("offline-toast");
      if (wasOffline.current) {
        wasOffline.current = false;
        toast.success("You're back online", {
          description: "Connection restored.",
          duration: 4000,
          id: "online-toast",
        });
      }
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
};

export default useOnlineStatus;
