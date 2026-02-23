import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAnimationProps {
  show: boolean;
  size?: number;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

/**
 * Apple Pay-style animated checkmark with optional text.
 * Shows a circle that draws itself, then a checkmark strokes in.
 */
export function SuccessAnimation({
  show,
  size = 80,
  message,
  subMessage,
  onComplete,
}: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="relative" style={{ width: size, height: size }}>
            {/* Glow backdrop */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1.5 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />

            <svg
              viewBox="0 0 80 80"
              width={size}
              height={size}
              className="relative z-10"
            >
              {/* Circle */}
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="url(#successGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />

              {/* Checkmark */}
              <motion.path
                d="M24 42 L35 53 L56 28"
                fill="none"
                stroke="#10b981"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.45, ease: 'easeOut' }}
                onAnimationComplete={onComplete}
              />

              <defs>
                <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {message && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <p className="text-lg font-bold text-slate-900">{message}</p>
              {subMessage && (
                <p className="mt-1 text-sm text-slate-500">{subMessage}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
