import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: unknown;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <select
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-blue-200 transition focus:border-blue-500 focus:ring-2',
          error && 'border-red-500 ring-red-200 focus:border-red-500 focus:ring-red-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{String(error)}</p> : null}
    </div>
  );
});
