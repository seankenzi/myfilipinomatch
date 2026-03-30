import { useState, useEffect } from "react";
import { getSignedPhotoUrls, getSignedPhotoUrl } from "@/lib/storage";

/**
 * Hook that converts stored photo paths/URLs to signed URLs for display.
 * Automatically refreshes when the input changes.
 */
export function useSignedPhotos(photos: string[]): string[] {
  const [signedUrls, setSignedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!photos.length) {
      setSignedUrls([]);
      return;
    }
    
    let cancelled = false;
    getSignedPhotoUrls(photos).then((urls) => {
      if (!cancelled) setSignedUrls(urls);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(photos)]);

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
