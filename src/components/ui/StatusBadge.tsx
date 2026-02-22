import { STATUS_COLORS } from '../../lib/constants';
import { cn, toTitleCase } from '../../lib/utils';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
  /** Override the display label without changing the colour logic. */
  label?: string;
}

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return <Badge className={cn('capitalize', color)}>{label ?? toTitleCase(status)}</Badge>;
};
