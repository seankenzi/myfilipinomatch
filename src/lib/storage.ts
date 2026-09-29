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

// Photo size context presets for Supabase image transforms.
// Originals stay untouched in storage; we serve smaller variants on demand.
export type PhotoContext = "thumb" | "grid" | "detail" | "fullscreen" | "original";

export const PHOTO_TRANSFORMS: Record<PhotoContext, { width?: number; quality?: number }> = {
  thumb: { width: 200, quality: 75 },        // avatars, tiny previews
  grid: { width: 600, quality: 80 },         // discover cards, profile thumbnails
  detail: { width: 1200, quality: 85 },      // profile detail main photo
  fullscreen: { width: 1920, quality: 90 },  // full-screen photo viewer
  original: {},                              // no transform
};

type TransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

// Signed URL cache. Keyed by `path|width|quality|resize` so the same path at
// different sizes is cached separately. Mirrored to sessionStorage so reloads
// and navigations reuse identical URLs (letting the browser reuse its image cache).
type CacheEntry = { url: string; expires: number };
const CACHE_TTL = 50 * 60 * 1000; // 50 min (URLs are signed for 60)
const SESSION_KEY = "signed-photo-urls-v1";
const signedUrlCache = new Map<string, CacheEntry>();

function loadSessionCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const now = Date.now();
    const obj = JSON.parse(raw) as Record<string, CacheEntry>;
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v.url === "string" && v.expires > now) signedUrlCache.set(k, v);
    }
  } catch { /* ignore */ }
}
loadSessionCache();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistSessionCache() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const now = Date.now();
      const obj: Record<string, CacheEntry> = {};
      for (const [k, v] of signedUrlCache) {
        if (v.expires > now) obj[k] = v;
        else signedUrlCache.delete(k);
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
    } catch { /* quota or unavailable */ }
  }, 200);
}

function readCache(key: string): string | null {
  const entry = signedUrlCache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    signedUrlCache.delete(key);
    persistSessionCache();
    return null;
  }
  return entry.url;
}

function writeCache(key: string, url: string) {
  signedUrlCache.set(key, { url, expires: Date.now() + CACHE_TTL });
  persistSessionCache();
}

function cacheKey(path: string, transform?: TransformOptions): string {
  if (!transform) return path;
  const { width, height, quality, resize } = transform;
  return `${path}|w=${width ?? ""}|h=${height ?? ""}|q=${quality ?? ""}|r=${resize ?? ""}`;
}

/** Synchronously returns a cached signed URL, or null. */
export function getCachedSignedPhotoUrl(urlOrPath: string, context: PhotoContext = "detail"): string | null {
  if (isAlreadySigned(urlOrPath)) return urlOrPath;
  return readCache(cacheKey(extractStoragePath(urlOrPath), transformFromContext(context)));
}

function isAlreadySigned(url: string): boolean {
  return url.startsWith("http") && url.includes("token=");
}

function transformFromContext(context?: PhotoContext): TransformOptions | undefined {
  if (!context || context === "original") return undefined;
  const preset = PHOTO_TRANSFORMS[context];
  if (!preset.width && !preset.quality) return undefined;
  // Use "contain" so Supabase preserves the original aspect ratio when only
  // width is specified. CSS (object-cover) handles any framing/cropping.
  return { ...preset, resize: "contain" };
}

/**
 * Creates a signed URL for a profile photo, optionally with image transforms.
 * Returns the original string if signing fails.
 */
export async function getSignedPhotoUrl(
  urlOrPath: string,
  contextOrExpiresIn: PhotoContext | number = "detail",
  expiresIn = 3600,
): Promise<string> {
  if (isAlreadySigned(urlOrPath)) return urlOrPath;

  // Backward compatibility: if a number was passed (old signature), treat it as expiresIn with no transform.
  let context: PhotoContext = "detail";
  let expires = expiresIn;
  if (typeof contextOrExpiresIn === "number") {
    expires = contextOrExpiresIn;
    context = "original";
  } else {
    context = contextOrExpiresIn;
  }

  const transform = transformFromContext(context);
  const path = extractStoragePath(urlOrPath);
  const key = cacheKey(path, transform);
  const cached = readCache(key);
  if (cached) return cached;

  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(path, expires, transform ? { transform } : undefined);
  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return urlOrPath; // fallback
  }
  writeCache(key, data.signedUrl);
  return data.signedUrl;
}

/**
 * Creates signed URLs for multiple photos in batch with optional image transforms.
 */
export async function getSignedPhotoUrls(
  urlsOrPaths: string[],
  context: PhotoContext = "detail",
  expiresIn = 3600,
): Promise<string[]> {
  if (!urlsOrPaths.length) return [];

  const transform = transformFromContext(context);
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
    const cached = readCache(cacheKey(path, transform));
    if (cached) {
      results[i] = cached;
    } else {
      toSign.push(path);
      toSignIndices.push(i);
    }
  }

  if (toSign.length === 0) return results;

  // Note: Supabase's createSignedUrls (batch) does not accept transform options,
  // so when transforms are requested we must sign individually in parallel.
  if (transform) {
    const signed = await Promise.all(
      toSign.map(async (p) => {
        const { data, error } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(p, expiresIn, { transform });
        if (error || !data?.signedUrl) return null;
        return data.signedUrl;
      }),
    );
    for (let i = 0; i < toSignIndices.length; i++) {
      const url = signed[i];
      const idx = toSignIndices[i];
      if (url) {
        results[idx] = url;
        writeCache(cacheKey(toSign[i], transform), url);
      } else {
        results[idx] = urlsOrPaths[idx];
      }
    }
    return results;
  }

  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrls(toSign, expiresIn);

  if (error || !data) {
    console.error("Failed to create signed URLs:", error);
    toSignIndices.forEach((idx) => { results[idx] = urlsOrPaths[idx]; });
    return results;
  }

  for (let i = 0; i < toSignIndices.length; i++) {
    const url = data[i]?.signedUrl || "";
    const idx = toSignIndices[i];
    if (url) {
      results[idx] = url;
      writeCache(cacheKey(toSign[i], undefined), url);
    } else {
      results[idx] = urlsOrPaths[idx];
    }
  }

  return results;
}
