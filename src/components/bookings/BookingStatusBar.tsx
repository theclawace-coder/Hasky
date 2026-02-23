import { XCircle } from 'lucide-react';
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface BookingStatusBarProps {
  status: string;
}

export function BookingStatusBar({ status }: BookingStatusBarProps) {
  const linearStatuses = BOOKING_STATUSES.filter((step) => step !== 'cancelled');
  const index = linearStatuses.indexOf(status as (typeof linearStatuses)[number]);
  const cancelled = status === 'cancelled';

  if (cancelled) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <XCircle className="size-4 shrink-0 text-red-500" />
        <span className="text-sm font-semibold text-red-700">Job Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-start">
      {linearStatuses.map((step, stepIndex) => {
        const isPast = stepIndex < index;
        const isCurrent = stepIndex === index;
        const isLast = stepIndex === linearStatuses.length - 1;

        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Left connector */}
              <div className={cn(
                'h-0.5 flex-1 rounded-full transition-colors',
                stepIndex === 0 ? 'invisible' : isPast || isCurrent ? 'bg-violet-400' : 'bg-slate-200',
              )} />

              {/* Circle */}
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                isPast
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : isCurrent
                    ? 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-200 ring-4 ring-violet-100'
                    : 'border-slate-200 bg-white text-slate-400',
              )}>
                {isPast ? '✓' : stepIndex + 1}
              </div>

              {/* Right connector */}
              <div className={cn(
                'h-0.5 flex-1 rounded-full transition-colors',
                isLast ? 'invisible' : isPast ? 'bg-violet-400' : 'bg-slate-200',
              )} />
            </div>

            {/* Label */}
            <p className={cn(
              'mt-2 text-center text-xs font-medium leading-tight',
              isPast ? 'text-emerald-600' : isCurrent ? 'text-violet-700' : 'text-slate-400',
            )}>
              {BOOKING_STATUS_LABELS[step] ?? step}
            </p>
          </div>
        );
      })}
    </div>
  );
}
