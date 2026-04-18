import { useState, useEffect, useRef } from "react";
import { getSignedPhotoUrls, getSignedPhotoUrl, type PhotoContext } from "@/lib/storage";

/**
 * Hook that converts stored photo paths/URLs to signed URLs for display.
 * Caches results, applies image transforms based on `context`, and aggressively
 * preloads ALL photos in parallel so carousel swipes feel instant.
 */
export function useSignedPhotos(photos: string[], context: PhotoContext = "detail"): string[] {
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const photosKey = JSON.stringify(photos);

  useEffect(() => {
    if (!photos.length) {
      setSignedUrls([]);
      return;
    }

    let cancelled = false;

    getSignedPhotoUrls(photos, context).then((urls) => {
      if (cancelled) return;
      const filtered = urls.filter(Boolean);
      setSignedUrls(filtered);
      // Preload ALL photos in parallel so swipe transitions feel instant.
      filtered.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photosKey, context]);

  return signedUrls;
}

/**
 * Hook that converts a single stored photo path/URL to a signed URL.
 */
export function useSignedPhoto(
  photo: string | null | undefined,
  context: PhotoContext = "detail",
): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setSignedUrl(null);
      return;
    }

    let cancelled = false;
    getSignedPhotoUrl(photo, context).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [photo, context]);

  return signedUrl;
}
