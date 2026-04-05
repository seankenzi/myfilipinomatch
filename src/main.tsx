import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const serviceWorkerCleanupKey = "__lovable_service_worker_cleanup_v2";

const cleanupStaleServiceWorkers = async () => {
  // Skip if already cleaned up (use localStorage to persist across tab discards)
  if (localStorage.getItem(serviceWorkerCleanupKey)) {
    return;
  }

  const registrations = await (navigator.serviceWorker?.getRegistrations() ?? Promise.resolve([]));
  const cacheKeys = "caches" in window ? await caches.keys() : [];

  if (registrations.length === 0 && cacheKeys.length === 0) {
    // Nothing to clean — mark as done so we never check again
    localStorage.setItem(serviceWorkerCleanupKey, "true");
    return;
  }

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }

  localStorage.setItem(serviceWorkerCleanupKey, "true");
  window.location.reload();
};

void cleanupStaleServiceWorkers().catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);

// Signal to Prerender.io that the page is fully rendered
(window as any).prerenderReady = true;
