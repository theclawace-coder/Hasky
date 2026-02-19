import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { CrossHireDeal } from '../../types';

export function DealCard({ deal }: { deal: CrossHireDeal }) {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">{deal.lead_client_name}</h3>
        <p className="text-xs text-slate-600">{deal.machine_category_needed} • {deal.location_needed}</p>
        <p className="text-xs text-slate-600">{formatDate(deal.start_date_needed)} - {formatDate(deal.end_date_needed)}</p>
        <div className="flex items-center justify-between">
          <StatusBadge status={deal.status} />
          <span className="text-xs font-semibold text-emerald-700">{formatCurrency(Number(deal.margin ?? 0))}</span>
        </div>
      </div>
    </Card>
  );
}
