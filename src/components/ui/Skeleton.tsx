import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  /** Set to 'pulse' for classic pulse, 'shimmer' (default) for wave sweep */
  variant?: 'shimmer' | 'pulse';
}

export function Skeleton({ className, variant = 'shimmer' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md',
        variant === 'shimmer'
          ? 'skeleton-shimmer bg-slate-100'
          : 'animate-pulse bg-slate-200',
        className,
      )}
    />
  );
}
