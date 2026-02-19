import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

export default function AdminDashboard() {
  const statsQuery = useQuery({
    queryKey: ['admin_stats'],
    queryFn: getAdminStats,
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total companies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.totalCompanies ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total machines</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.totalMachines ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Available machines</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.totalAvailableMachines ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Active cross-hire deals</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.activeCrossHireDeals ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Cross-hire revenue (month)</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(stats?.crossHireRevenueThisMonth ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Cross-hire margin (month)</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(stats?.crossHireMarginThisMonth ?? 0)}</p>
        </Card>
      </div>
    </div>
  );
}
