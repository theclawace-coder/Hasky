/**
 * notify.ts — Premium toast notification helpers with sound & confetti
 *
 * Usage:
 *   import { notify } from '../lib/notify';
 *   notify.success('Machine added', 'Your excavator is now listed.');
 *   notify.booking('Mini Excavator booked for Tuesday');
 *   notify.earned('You just earned $420 from the Riggo job');
 *   notify.paymentReceived('Invoice #INV-042 paid');    // ka-ching + confetti
 *
 *   // Progress toast:
 *   const done = notify.progress('Sending invoice…');
 *   await sendInvoice();
 *   done('Invoice sent!');
 *
 *   // Undo toast:
 *   notify.withUndo('Expense deleted', () => restoreExpense(id));
 */
import { toast } from 'sonner';
import { sounds } from './sounds';
import { confettiEffects } from './confetti';

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
const success: ToastFn = (title, description) => {
  sounds.success();
  toast.success(title, {
    description,
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #10b981',
    },
  });
};

/** Error */
const error: ToastFn = (title, description) => {
  sounds.error();
  toast.error(title, {
    description,
    duration: 5000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #ef4444',
    },
  });
};

/** Info — neutral violet */
const info: ToastFn = (title, description) => {
  sounds.notification();
  toast.info(title, {
    description,
    duration: 4000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #8b5cf6',
    },
  });
};

/** Warning — amber */
const warning: ToastFn = (title, description) => {
  sounds.notification();
  toast.warning(title, {
    description,
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #f59e0b',
    },
  });
};

/** Booking confirmed — violet accent + ascending chord */
const booking = (message: string) => {
  sounds.bookingConfirmed();
  confettiEffects.success();
  toast.success(`📅 ${message}`, {
    duration: 5000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #7c3aed',
    },
  });
};

/** Revenue / earnings — money green + ka-ching */
const earned = (message: string) => {
  sounds.kaChing();
  toast.success(`💰 ${message}`, {
    duration: 5500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #059669',
      fontWeight: '600',
    },
  });
};

/** Payment received — ka-ching + gold confetti from both sides */
const paymentReceived = (message: string) => {
  sounds.kaChing();
  confettiEffects.payment();
  toast.success(`💰 ${message}`, {
    duration: 6000,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #059669',
      fontWeight: '600',
    },
  });
};

/** Encouragement — motivation prompt */
const encourage = (message: string) => {
  sounds.notification();
  toast(message, {
    duration: 5000,
    icon: '🚀',
    style: {
      ...glassStyle,
      borderLeft: '3px solid #818cf8',
    },
  });
};

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
const matched = (message: string) => {
  sounds.success();
  toast.success(`✅ ${message}`, {
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #10b981',
    },
  });
};

/** Sent (quote, invoice, email) — whoosh sound */
const sent = (message: string) => {
  sounds.whoosh();
  toast.success(`📤 ${message}`, {
    duration: 4500,
    style: {
      ...glassStyle,
      borderLeft: '3px solid #6366f1',
    },
  });
};

/** Deleted / removed — subtle */
const deleted = (message: string) => {
  toast(message, {
    duration: 3500,
    icon: '🗑️',
    style: {
      ...glassStyle,
      borderLeft: '3px solid #94a3b8',
    },
  });
};

/** Big celebration — confetti shower + jingle. Use for milestones. */
const celebrate = (message: string, description?: string) => {
  sounds.celebration();
  confettiEffects.celebration();
  toast.success(message, {
    description,
    duration: 6000,
    icon: '🎉',
    style: {
      ...glassStyle,
      borderLeft: '3px solid #8b5cf6',
      fontWeight: '600',
    },
  });
};

/**
 * Progress toast — shows a loading state, then resolves to success.
 * Returns a `done(message)` callback to complete the toast.
 *
 *   const done = notify.progress('Sending invoice…');
 *   await sendInvoice();
 *   done('Invoice sent!');
 */
const progress = (loadingMessage: string) => {
  const id = toast.loading(loadingMessage, {
    style: {
      ...glassStyle,
      borderLeft: '3px solid #8b5cf6',
    },
  });

  return (doneMessage: string, options?: { error?: boolean }) => {
    if (options?.error) {
      sounds.error();
      toast.error(doneMessage, {
        id,
        duration: 5000,
        style: {
          ...glassStyle,
          borderLeft: '3px solid #ef4444',
        },
      });
    } else {
      sounds.success();
      toast.success(`✓ ${doneMessage}`, {
        id,
        duration: 4000,
        style: {
          ...glassStyle,
          borderLeft: '3px solid #10b981',
        },
      });
    }
  };
};

/**
 * Toast with undo action for destructive operations.
 *
 *   notify.withUndo('Expense deleted', () => restoreExpense(id));
 */
const withUndo = (message: string, onUndo: () => void, undoLabel = 'Undo') => {
  toast(message, {
    duration: 6000,
    icon: '🗑️',
    style: {
      ...glassStyle,
      borderLeft: '3px solid #94a3b8',
    },
    action: {
      label: undoLabel,
      onClick: () => {
        onUndo();
        sounds.success();
        toast.success('Action undone', {
          duration: 3000,
          style: {
            ...glassStyle,
            borderLeft: '3px solid #10b981',
          },
        });
      },
    },
  });
};

/**
 * Promise-based toast — tracks an async operation automatically.
 *
 *   notify.promise(sendEmail(), {
 *     loading: 'Sending email…',
 *     success: 'Email sent!',
 *     error: 'Failed to send email',
 *   });
 */
const promise = <T,>(
  promiseOrFn: Promise<T>,
  messages: { loading: string; success: string; error: string },
) => {
  return toast.promise(promiseOrFn, {
    loading: messages.loading,
    success: () => {
      sounds.success();
      return `✓ ${messages.success}`;
    },
    error: () => {
      sounds.error();
      return messages.error;
    },
    style: {
      ...glassStyle,
      borderLeft: '3px solid #8b5cf6',
    },
  });
};

export const notify = {
  success,
  error,
  info,
  warning,
  booking,
  earned,
  paymentReceived,
  encourage,
  insight,
  matched,
  sent,
  deleted,
  celebrate,
  progress,
  withUndo,
  promise,
};
