/**
 * sounds.ts — Web Audio API sound effects for HireBase
 *
 * Generates all sounds programmatically (no audio files needed).
 * Respects a global mute preference persisted to localStorage.
 */

const STORAGE_KEY = 'hirebase_sounds_muted';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch { /* private browsing */ }
}

export function toggleMute(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  rampDown = true,
) {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* AudioContext not available */ }
}

function playChord(
  frequencies: number[],
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
) {
  frequencies.forEach((f) => playTone(f, duration, type, volume));
}

/** Bright two-note chime — for success actions (booking confirmed, machine added, etc.) */
export function playSuccess() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    g1.gain.setValueAtTime(0.15, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: G5 (delayed slightly)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.1);
    g2.gain.setValueAtTime(0.001, now);
    g2.gain.setValueAtTime(0.15, now + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch { /* noop */ }
}

/** Ka-ching! — satisfying cash register sound for payments */
export function playKaChing() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // High metallic "ching"
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1318.5, now);
    g1.gain.setValueAtTime(0.18, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Coin rattle
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2637, now + 0.05);
    g2.gain.setValueAtTime(0.001, now);
    g2.gain.setValueAtTime(0.12, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.3);

    // Low register bell
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(880, now + 0.08);
    g3.gain.setValueAtTime(0.001, now);
    g3.gain.setValueAtTime(0.10, now + 0.08);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc3.connect(g3).connect(ctx.destination);
    osc3.start(now + 0.08);
    osc3.stop(now + 0.5);
  } catch { /* noop */ }
}

/** Soft notification ping — for toasts appearing */
export function playNotification() {
  playTone(880, 0.15, 'sine', 0.08);
}

/** Low error thud */
export function playError() {
  if (isMuted()) return;
  playTone(180, 0.25, 'square', 0.06);
  setTimeout(() => playTone(140, 0.2, 'square', 0.04), 80);
}

/** Swoosh — for sending emails, transitioning steps */
export function playWhoosh() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch { /* noop */ }
}

/** Booking confirmed — ascending chord */
export function playBookingConfirmed() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, now);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch { /* noop */ }
}

/** Subtle click for toggles / micro-interactions */
export function playClick() {
  playTone(600, 0.04, 'sine', 0.04, false);
}

/** Soft triple-note jingle for celebrations/milestones */
export function playCelebration() {
  if (isMuted()) return;
  playChord([523.25, 659.25, 783.99], 0.6, 'sine', 0.1);
  setTimeout(() => playChord([587.33, 739.99, 880], 0.8, 'sine', 0.08), 200);
}

export const sounds = {
  success: playSuccess,
  kaChing: playKaChing,
  notification: playNotification,
  error: playError,
  whoosh: playWhoosh,
  bookingConfirmed: playBookingConfirmed,
  click: playClick,
  celebration: playCelebration,
  isMuted,
  setMuted,
  toggleMute,
};
