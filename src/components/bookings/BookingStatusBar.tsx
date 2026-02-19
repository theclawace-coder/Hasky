import { BOOKING_STATUSES } from '../../lib/constants';
import { cn, toTitleCase } from '../../lib/utils';

interface BookingStatusBarProps {
  status: string;
}

export function BookingStatusBar({ status }: BookingStatusBarProps) {
  const index = BOOKING_STATUSES.indexOf(status as (typeof BOOKING_STATUSES)[number]);

  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {BOOKING_STATUSES.map((step, stepIndex) => (
        <div
          key={step}
          className={cn(
            'rounded-lg border p-3 text-center text-xs font-medium',
            stepIndex <= index ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500',
          )}
        >
          {toTitleCase(step)}
        </div>
      ))}
    </div>
  );
}
