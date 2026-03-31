// Programmatic ringtone using Web Audio API — no external files needed
let audioContext: AudioContext | null = null;
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;
let isPlaying = false;

const getContext = () => {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const playTone = (ctx: AudioContext, freq: number, startTime: number, duration: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
  gain.gain.setValueAtTime(0.3, startTime + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

/** Play a double-beep ring pattern that repeats every 2.5s */
export const startRingtone = () => {
  if (isPlaying) return;
  isPlaying = true;

  const ring = () => {
    try {
      const ctx = getContext();
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      // Double beep pattern (like a phone ring)
      playTone(ctx, 440, now, 0.25);
      playTone(ctx, 480, now, 0.25);
      playTone(ctx, 440, now + 0.35, 0.25);
      playTone(ctx, 480, now + 0.35, 0.25);
    } catch {
      // Audio may not be available
    }
  };

  ring();
  ringtoneInterval = setInterval(ring, 2500);
};

/** Stop the ringing */
export const stopRingtone = () => {
  isPlaying = false;
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};
