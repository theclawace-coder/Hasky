/**
 * notify.ts — Premium toast notification helpers
 *
 * Usage:
 *   import { notify } from '../lib/notify';
 *   notify.success('Machine added', 'Your excavator is now listed.');
 *   notify.booking('Mini Excavator booked for Tuesday 🎉');
 *   notify.earned('You just earned $420 from the Riggo job 💰');
 */
import { toast } from 'sonner';

type ToastFn = (title: string, description?: string) => void;

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.70)',
  borderRadius: '18px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
};

/** Success — green glow, great for "action completed" moments */
const success: ToastFn = (title, description) =>
  toast.success(title, {
    description,
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #10b981',
    },
  });

/** Error */
const error: ToastFn = (title, description) =>
  toast.error(title, {
    description,
    duration: 5000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #ef4444',
    },
  });

/** Info — neutral violet */
const info: ToastFn = (title, description) =>
  toast.info(title, {
    description,
    duration: 4000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #8b5cf6',
    },
  });

/** Warning — amber */
const warning: ToastFn = (title, description) =>
  toast.warning(title, {
    description,
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #f59e0b',
    },
  });

/** Booking confirmed — violet accent */
const booking = (message: string) =>
  toast.success(`📅 ${message}`, {
    duration: 5000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #7c3aed',
    },
  });

/** Revenue / earnings — money green */
const earned = (message: string) =>
  toast.success(`💰 ${message}`, {
    duration: 5500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #059669',
      fontWeight: '600',
    },
  });

/** Encouragement — motivation prompt */
const encourage = (message: string) =>
  toast(message, {
    duration: 5000,
    icon: '🚀',
    style: {
      ...glassStyle,
      borderLeft: '3px solid #818cf8',
    },
  });

/** Insight — business tip */
const insight = (message: string) =>
  toast(message, {
    duration: 5500,
    icon: '💡',
    style: {
      ...glassStyle,
      borderLeft: '3px solid #0ea5e9',
    },
  });

/** Match / assignment confirmed */
const matched = (message: string) =>
  toast.success(`✅ ${message}`, {
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #10b981',
    },
  });

export const notify = {
  success,
  error,
  info,
  warning,
  booking,
  earned,
  encourage,
  insight,
  matched,
};
