import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: unknown;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          // Glass field base
          'h-11 w-full rounded-xl px-4 text-sm text-slate-900 outline-none',
          'backdrop-blur-md bg-white/65 border border-white/55',
          'shadow-sm shadow-black/5',
          'placeholder:text-slate-400',
          // Focus ring — violet glow
          'transition-all duration-200',
          'focus:bg-white/80 focus:border-violet-300 focus:shadow-md focus:shadow-violet-100',
          'focus:ring-3 focus:ring-violet-200/50',
          // Error state
          error && 'border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-red-100/50 focus:shadow-red-50',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <span className="size-3.5 rounded-full bg-red-100 text-center leading-3.5">!</span>
          {String(error)}
        </p>
      ) : null}
    </div>
  );
});
