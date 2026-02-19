import { useQuery } from '@tanstack/react-query';
import { getAllCompaniesWithStats, getMachines } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, TableContainer } from '../../components/ui/Table';

export default function CompaniesOverview() {
  const companiesQuery = useQuery({
    queryKey: ['admin_companies_stats'],
    queryFn: getAllCompaniesWithStats,
  });

  const machinesQuery = useQuery({
    queryKey: ['admin_all_machines'],
    queryFn: () => getMachines(),
  });

  const companies = (companiesQuery.data ?? []).sort((a, b) => b.availableMachines - a.availableMachines);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Companies Overview</h2>

      <TableContainer>
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">City</th>
              <th className="p-3">Total Machines</th>
              <th className="p-3">Available</th>
              <th className="p-3">Utilisation %</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-t border-slate-100">
                <td className="p-3 font-medium text-slate-900">{company.name}</td>
                <td className="p-3">{company.city ?? '-'}</td>
                <td className="p-3">{company.totalMachines}</td>
                <td className={`p-3 ${company.availableMachines > 5 ? 'font-semibold text-amber-600' : ''}`}>
                  {company.availableMachines}
                </td>
                <td className="p-3">{company.utilisation.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Company Machine List</h3>
        <div className="mt-3 space-y-2">
          {(machinesQuery.data ?? []).slice(0, 80).map((machine) => (
            <div key={machine.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{machine.name}</p>
              <p>{machine.companies?.name} • {machine.machine_categories?.name} • {machine.status}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
