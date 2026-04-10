import { useState, useEffect, useRef } from "react";
import { getSignedPhotoUrls, getSignedPhotoUrl } from "@/lib/storage";

// Module-level cache: raw path → signed URL (valid for ~1hr)
const signedUrlCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 50 * 60 * 1000; // 50 min (URLs valid 60 min, refresh early)

function getCached(paths: string[]): { hits: string[]; misses: string[]; missIndices: number[] } {
  const now = Date.now();
  const hits: string[] = new Array(paths.length).fill("");
  const misses: string[] = [];
  const missIndices: number[] = [];
  for (let i = 0; i < paths.length; i++) {
    const cached = signedUrlCache.get(paths[i]);
    if (cached && cached.expires > now) {
      hits[i] = cached.url;
    } else {
      misses.push(paths[i]);
      missIndices.push(i);
    }
  }
  return { hits, misses, missIndices };
}

/**
 * Hook that converts stored photo paths/URLs to signed URLs for display.
 * Caches results and preloads images for instant carousel transitions.
 */
export function useSignedPhotos(photos: string[]): string[] {
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const photosKey = JSON.stringify(photos);
  const prevKeyRef = useRef(photosKey);

  useEffect(() => {
    if (!photos.length) {
      setSignedUrls([]);
      return;
    }

    let cancelled = false;
    const { hits, misses, missIndices } = getCached(photos);

    // If all cached, return immediately
    if (misses.length === 0) {
      setSignedUrls(hits.filter(Boolean));
      // Preload images
      hits.forEach((url) => { const img = new Image(); img.src = url; });
      return;
    }

    // Set cached hits immediately so UI isn't blank
    if (hits.some(Boolean)) {
      setSignedUrls(hits);
    }

    getSignedPhotoUrls(misses).then((urls) => {
      if (cancelled) return;
      const now = Date.now();
      // Merge into hits — keep original path as fallback if signing failed
      for (let i = 0; i < missIndices.length; i++) {
        const signed = urls[i];
        if (signed) {
          hits[missIndices[i]] = signed;
          signedUrlCache.set(misses[i], { url: signed, expires: now + CACHE_TTL });
        } else {
          hits[missIndices[i]] = misses[i]; // keep original path
        }
      }
      const filtered = hits.filter(Boolean);
      setSignedUrls(filtered);
      // Preload all images
      filtered.forEach((url) => { const img = new Image(); img.src = url; });
    });

    return () => { cancelled = true; };
  }, [photosKey]);

  return signedUrls;
}

/**
 * Hook that converts a single stored photo path/URL to a signed URL.
 */
export function useSignedPhoto(photo: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setSignedUrl(null);
      return;
    }

    let cancelled = false;
    getSignedPhotoUrl(photo).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [photo]);

  return signedUrl;
}
