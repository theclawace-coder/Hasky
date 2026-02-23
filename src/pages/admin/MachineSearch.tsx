import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notify } from '../../lib/notify';
import { useCrossHireDeals } from '../../hooks/useCrossHireDeals';
import { useMachines } from '../../hooks/useMachines';
import { getAllCompaniesWithStats, searchAvailableMachines } from '../../services/api';
import { MachineSearchFilters } from '../../components/admin/MachineSearchFilters';
import { DealForm, type DealFormValues } from '../../components/admin/DealForm';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import type { CrossHireDeal } from '../../types';

export default function MachineSearch() {
  const [filters, setFilters] = useState({
    categoryId: '',
    location: '',
    companyId: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [open, setOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  const { categoriesQuery } = useMachines();
  const { saveDealMutation } = useCrossHireDeals();

  const companiesQuery = useQuery({
    queryKey: ['admin_companies_lookup'],
    queryFn: getAllCompaniesWithStats,
  });

  const machinesQuery = useQuery({
    queryKey: ['admin_machine_search', filters],
    queryFn: () =>
      searchAvailableMachines({
        categoryId: filters.categoryId || undefined,
        location: filters.location || undefined,
        companyId: filters.companyId || undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
  });

  const selectedMachine = useMemo(
    () => (machinesQuery.data ?? []).find((machine) => machine.id === selectedMachineId),
    [machinesQuery.data, selectedMachineId],
  );

  const createDeal = async (values: DealFormValues) => {
    try {
      const payload: Partial<CrossHireDeal> = {
        ...values,
        machine_id: selectedMachine?.id ?? null,
        supplier_company_id: selectedMachine?.company_id ?? null,
      };
      await saveDealMutation.mutateAsync(payload);
      notify.success('Deal created');
      setOpen(false);
      setSelectedMachineId(null);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to create deal');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Cross-Company Machine Search</h2>
      <MachineSearchFilters
        categories={categoriesQuery.data ?? []}
        companies={(companiesQuery.data ?? []).map((company) => ({
          id: company.id,
          name: company.name,
          abn: company.abn,
          phone: company.phone,
          email: company.email,
          address: company.address,
          city: company.city,
          state: company.state,
          logo_url: company.logo_url,
          created_at: company.created_at,
          updated_at: company.updated_at,
        }))}
        values={filters}
        onChange={(next) => setFilters((current) => ({ ...current, ...next }))}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(machinesQuery.data ?? []).map((machine) => (
          <Card key={machine.id} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{machine.name}</h3>
              <p className="text-sm text-slate-600">{machine.make} {machine.model}</p>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p>Category: {machine.machine_categories?.name ?? '-'}</p>
              <p>Company: {machine.companies?.name ?? '-'}</p>
              <p>Phone: {machine.companies?.phone ?? '-'}</p>
              <p>Email: {machine.companies?.email ?? '-'}</p>
              <p>Rate: {formatCurrency(Number(machine.daily_rate ?? 0))}/day</p>
              <StatusBadge status={machine.status} />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setSelectedMachineId(machine.id);
                setOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Deal
            </Button>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Cross-Hire Deal">
        <DealForm
          defaultValues={selectedMachine ? {
            machine_category_needed: selectedMachine.machine_categories?.name ?? '',
            location_needed: selectedMachine.location ?? '',
            supplier_company_id: selectedMachine.company_id,
            machine_id: selectedMachine.id,
            status: 'searching',
          } : undefined}
          onSubmit={createDeal}
          loading={saveDealMutation.isPending}
        />
      </Modal>
    </div>
  );
}
