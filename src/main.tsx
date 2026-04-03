import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const serviceWorkerCleanupKey = "__lovable_service_worker_cleanup_v2";

const cleanupStaleServiceWorkers = async () => {
  const registrations = await (navigator.serviceWorker?.getRegistrations() ?? Promise.resolve([]));
  const cacheKeys = "caches" in window ? await caches.keys() : [];

  if (
    (registrations.length === 0 && cacheKeys.length === 0) ||
    window.sessionStorage.getItem(serviceWorkerCleanupKey)
  ) {
    return;
  }

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }

  window.sessionStorage.setItem(serviceWorkerCleanupKey, "true");
  window.location.reload();
};

void cleanupStaleServiceWorkers().catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);

// Signal to Prerender.io that the page is fully rendered
(window as any).prerenderReady = true;
