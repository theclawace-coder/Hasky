import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { sounds } from '../../lib/sounds';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
}

const spring = {
  type: 'spring' as const,
  stiffness: 700,
  damping: 30,
};

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
}: ToggleSwitchProps) {
  const isSm = size === 'sm';
  const trackW = isSm ? 'w-9' : 'w-11';
  const trackH = isSm ? 'h-5' : 'h-6';
  const thumbSize = isSm ? 14 : 18;
  const travel = isSm ? 16 : 20;
  const [rippleKey, setRippleKey] = useState(0);

  const handleToggle = () => {
    if (disabled) return;
    sounds.click();
    setRippleKey((k) => k + 1);
    onChange(!checked);
  };

  return (
    <button
      role="switch"
      type="button"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'group flex items-center gap-3 text-left',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center rounded-full p-[3px]',
          'transition-colors duration-200',
          trackW,
          trackH,
          checked
            ? 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-inner shadow-violet-600/30'
            : 'bg-slate-200 shadow-inner shadow-slate-300/40',
          !disabled && 'group-hover:shadow-md',
        )}
      >
        {/* Ripple pulse on toggle */}
        <AnimatePresence>
          <motion.div
            key={rippleKey}
            className="absolute inset-0 rounded-full"
            initial={{ boxShadow: `0 0 0 0px ${checked ? 'rgba(139,92,246,0.4)' : 'rgba(148,163,184,0.4)'}` }}
            animate={{ boxShadow: `0 0 0 6px ${checked ? 'rgba(139,92,246,0)' : 'rgba(148,163,184,0)'}` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </AnimatePresence>

        <motion.div
          className={cn(
            'relative rounded-full bg-white',
            !disabled && 'shadow-md',
          )}
          style={{ width: thumbSize, height: thumbSize }}
          animate={{
            x: checked ? travel : 0,
            scale: 1,
          }}
          whileTap={{ scale: 1.15 }}
          transition={spring}
        />
      </div>
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <span className="block text-sm font-medium text-slate-700">{label}</span>
          )}
          {description && (
            <span className="block text-xs text-slate-400">{description}</span>
          )}
        </div>
      )}
    </button>
  );
}
