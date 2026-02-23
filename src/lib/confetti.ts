/**
 * confetti.ts — Celebration effects for HireBase
 *
 * Wraps canvas-confetti with preset configurations for key moments.
 */
import confetti from 'canvas-confetti';
import { isMuted } from './sounds';

const brand = ['#8b5cf6', '#7c3aed', '#38bdf8', '#c084fc', '#818cf8'];
const gold = ['#f59e0b', '#eab308', '#fbbf24', '#d97706', '#fcd34d'];

/** Standard burst from the centre — bookings, quotes, general wins */
export function fireSuccess() {
  void confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: brand,
    ticks: 120,
    gravity: 1.2,
    scalar: 0.9,
  });
}

/** Money rain from both sides — payment received */
export function firePayment() {
  const defaults = {
    particleCount: 40,
    spread: 55,
    ticks: 150,
    colors: gold,
    gravity: 0.8,
    scalar: 1.1,
  };
  void confetti({ ...defaults, angle: 60, origin: { x: 0, y: 0.6 } });
  void confetti({ ...defaults, angle: 120, origin: { x: 1, y: 0.6 } });
}

/** Big celebration — first booking, revenue milestones */
export function fireCelebration() {
  const end = Date.now() + 1500;
  const allColors = [...brand, ...gold];

  (function frame() {
    void confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: allColors,
    });
    void confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: allColors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Subtle sparkle at an element's position */
export function fireAt(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  void confetti({
    particleCount: 30,
    spread: 50,
    origin: { x, y },
    colors: brand,
    ticks: 80,
    gravity: 1.5,
    scalar: 0.7,
    startVelocity: 20,
  });
}

/**
 * Smart celebration — combines confetti + optional sound.
 * Call directly for "moment" events.
 */
export function celebrate(type: 'success' | 'payment' | 'big' = 'success') {
  if (isMuted()) {
    // Still fire visuals even if sound is muted
  }
  switch (type) {
    case 'payment':
      firePayment();
      break;
    case 'big':
      fireCelebration();
      break;
    default:
      fireSuccess();
  }
}

export const confettiEffects = {
  success: fireSuccess,
  payment: firePayment,
  celebration: fireCelebration,
  fireAt,
  celebrate,
};
