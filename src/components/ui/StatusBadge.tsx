import { STATUS_COLORS } from '../../lib/constants';
import { cn, toTitleCase } from '../../lib/utils';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return <Badge className={cn('capitalize', color)}>{toTitleCase(status)}</Badge>;
};
