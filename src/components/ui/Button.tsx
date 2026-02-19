import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600',
    'text-white font-semibold',
    'shadow-lg shadow-violet-500/25',
    'hover:shadow-xl hover:shadow-violet-500/35 hover:brightness-110',
    'active:scale-[0.97] active:brightness-95',
    'disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed',
  ].join(' '),

  secondary: [
    'backdrop-blur-md bg-white/75 border border-white/60',
    'text-slate-700 font-medium',
    'shadow-sm shadow-black/5',
    'hover:bg-white/90 hover:shadow-md hover:-translate-y-px',
    'active:scale-[0.98] active:bg-white/70',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-slate-600',
    'hover:bg-white/60 hover:backdrop-blur-md hover:text-slate-900 hover:shadow-sm',
    'active:bg-white/40 active:scale-[0.98]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  danger: [
    'bg-gradient-to-r from-red-500 to-rose-600',
    'text-white font-semibold',
    'shadow-lg shadow-red-500/25',
    'hover:shadow-xl hover:shadow-red-500/35 hover:brightness-110',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed',
  ].join(' '),

  success: [
    'bg-gradient-to-r from-emerald-500 to-teal-500',
    'text-white font-semibold',
    'shadow-lg shadow-emerald-500/25',
    'hover:shadow-xl hover:shadow-emerald-500/35 hover:brightness-110',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed',
  ].join(' '),

  outline: [
    'bg-transparent border border-violet-300/60',
    'text-violet-700 font-medium',
    'hover:bg-violet-50/60 hover:border-violet-400 hover:shadow-sm',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex min-h-[36px] items-center justify-center',
        'font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin opacity-70" />
          <span className="opacity-70">Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
