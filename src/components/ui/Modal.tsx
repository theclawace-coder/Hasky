import { type PropsWithChildren, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: ModalSize;
  description?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

const easing = [0.25, 0.46, 0.45, 0.94] as const;

export function Modal({ open, title, description, onClose, children, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={cn(
              'relative w-full rounded-3xl overflow-hidden',
              'glass shadow-2xl shadow-black/15',
              sizeClasses[size],
            )}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.24, ease: easing }}
          >
            {/* Gradient accent line at top */}
            <div
              className="h-[3px] w-full"
              style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8, #38bdf8)' }}
            />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/30 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
                {description ? (
                  <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-xl p-2 text-slate-400 transition-all hover:bg-white/60 hover:text-slate-600 hover:shadow-sm"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
