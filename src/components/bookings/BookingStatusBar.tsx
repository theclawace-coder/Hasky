import { BOOKING_STATUS_LABELS, BOOKING_STATUSES } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface BookingStatusBarProps {
  status: string;
}

export function BookingStatusBar({ status }: BookingStatusBarProps) {
  const linearStatuses = BOOKING_STATUSES.filter((step) => step !== 'cancelled');
  const index = linearStatuses.indexOf(status as (typeof linearStatuses)[number]);
  const cancelled = status === 'cancelled';

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {linearStatuses.map((step, stepIndex) => {
          const isPast    = !cancelled && stepIndex < index;
          const isCurrent = !cancelled && stepIndex === index;
          return (
            <div
              key={step}
              className={cn(
                'rounded-lg border p-3 text-center text-xs font-medium',
                isPast    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : isCurrent ? 'border-violet-300 bg-violet-50 text-violet-700 ring-2 ring-violet-200'
                : 'border-slate-200 bg-slate-50 text-slate-400',
              )}
            >
              {isPast ? '✓ ' : ''}{BOOKING_STATUS_LABELS[step] ?? step}
            </div>
          );
        })}
      </div>
      {cancelled ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700">
          Cancelled
        </div>
      ) : null}
    </div>
  );
}
