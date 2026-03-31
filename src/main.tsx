import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Guard: never register SW in iframe or preview contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  const previewCleanupKey = "__lovable_preview_cache_cleared";

  Promise.all([
    navigator.serviceWorker?.getRegistrations() ?? Promise.resolve([]),
    "caches" in window ? caches.keys() : Promise.resolve([] as string[]),
  ]).then(async ([registrations, cacheKeys]) => {
    await Promise.all(registrations.map((r) => r.unregister()));

    if ("caches" in window) {
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    const needsOneTimeReload = (registrations.length > 0 || cacheKeys.length > 0)
      && !window.sessionStorage.getItem(previewCleanupKey);

    if (needsOneTimeReload) {
      window.sessionStorage.setItem(previewCleanupKey, "true");
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
