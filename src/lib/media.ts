/**
 * Attempt to acquire a media stream with a hard timeout.
 * On Android WebView (Capacitor), getUserMedia can hang indefinitely
 * if native permissions aren't properly handled. This wrapper ensures
 * we never block the UI — returns null on timeout or error.
 */
export const getMediaStreamWithTimeout = (
  constraints: MediaStreamConstraints = { video: true, audio: true },
  timeoutMs = 5000
): Promise<MediaStream | null> =>
  Promise.race([
    navigator.mediaDevices
      .getUserMedia(constraints)
      .catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
