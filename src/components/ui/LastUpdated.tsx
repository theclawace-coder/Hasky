import { cn } from '../../lib/utils';
import { useTimeAgo } from '../../hooks/useTimeAgo';

interface LastUpdatedProps {
  date: Date | string | null | undefined;
  className?: string;
  prefix?: string;
}

/**
 * Live-updating "Updated 3m ago" timestamp that fades in on mount.
 * Ticks more frequently for recent times (every 5s), slowing down over time.
 */
export function LastUpdated({ date, className, prefix = 'Updated' }: LastUpdatedProps) {
  const text = useTimeAgo(date);

  if (!text) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium animate-fade-in select-none',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-emerald-400 animate-dot-breathe" />
      {prefix} {text}
    </span>
  );
}
