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

/**
 * Creates a signed URL for a profile photo.
 * Returns the original string if signing fails.
 */
export async function getSignedPhotoUrl(urlOrPath: string, expiresIn = 3600): Promise<string> {
  const path = extractStoragePath(urlOrPath);
  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return urlOrPath; // fallback
  }
  return data.signedUrl;
}

/**
 * Creates signed URLs for multiple photos in batch.
 */
export async function getSignedPhotoUrls(urlsOrPaths: string[], expiresIn = 3600): Promise<string[]> {
  if (!urlsOrPaths.length) return [];
  
  const paths = urlsOrPaths.map(extractStoragePath);
  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrls(paths, expiresIn);
  
  if (error || !data) {
    console.error("Failed to create signed URLs:", error);
    return urlsOrPaths; // fallback
  }
  
  return data.map((item, i) => item.signedUrl || urlsOrPaths[i]);
}
