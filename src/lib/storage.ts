import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the storage path from a public URL or returns the path as-is.
 * Handles both full public URLs and raw paths.
 */
export function extractStoragePath(urlOrPath: string): string {
  const marker = "/profile-photos/";
  const idx = urlOrPath.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(urlOrPath.substring(idx + marker.length));
  }
  return urlOrPath;
}

// Module-level signed URL cache
const signedUrlCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 50 * 60 * 1000; // 50 min

function isAlreadySigned(url: string): boolean {
  return url.startsWith("http") && url.includes("token=");
}

/**
 * Creates a signed URL for a profile photo.
 * Returns the original string if signing fails.
 */
export async function getSignedPhotoUrl(urlOrPath: string, expiresIn = 3600): Promise<string> {
  if (isAlreadySigned(urlOrPath)) return urlOrPath;

  const path = extractStoragePath(urlOrPath);
  const now = Date.now();
  const cached = signedUrlCache.get(path);
  if (cached && cached.expires > now) return cached.url;

  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return urlOrPath; // fallback
  }
  signedUrlCache.set(path, { url: data.signedUrl, expires: now + CACHE_TTL });
  return data.signedUrl;
}

/**
 * Creates signed URLs for multiple photos in batch.
 * Uses cache to skip already-signed paths.
 */
export async function getSignedPhotoUrls(urlsOrPaths: string[], expiresIn = 3600): Promise<string[]> {
  if (!urlsOrPaths.length) return [];

  const now = Date.now();
  const results: string[] = new Array(urlsOrPaths.length).fill("");
  const toSign: string[] = [];
  const toSignIndices: number[] = [];

  for (let i = 0; i < urlsOrPaths.length; i++) {
    const raw = urlsOrPaths[i];
    if (isAlreadySigned(raw)) {
      results[i] = raw;
      continue;
    }
    const path = extractStoragePath(raw);
    const cached = signedUrlCache.get(path);
    if (cached && cached.expires > now) {
      results[i] = cached.url;
    } else {
      toSign.push(path);
      toSignIndices.push(i);
    }
  }

  if (toSign.length === 0) return results;

  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrls(toSign, expiresIn);

  if (error || !data) {
    console.error("Failed to create signed URLs:", error);
    // Fill misses with originals
    toSignIndices.forEach((idx) => { results[idx] = urlsOrPaths[idx]; });
    return results;
  }

  for (let i = 0; i < toSignIndices.length; i++) {
    const url = data[i]?.signedUrl || "";
    const idx = toSignIndices[i];
    if (url) {
      results[idx] = url;
      signedUrlCache.set(toSign[i], { url, expires: now + CACHE_TTL });
    } else {
      // Keep the original path as fallback so photos aren't dropped
      results[idx] = urlsOrPaths[idx];
    }
  }

  return results;
}
