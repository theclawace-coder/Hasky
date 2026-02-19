import { useMemo, useState } from 'react';
import { List, LayoutGrid, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useMachines } from '../../hooks/useMachines';
import { MachineForm, type MachineFormValues } from '../../components/fleet/MachineForm';
import { MachineCard } from '../../components/fleet/MachineCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableContainer } from '../../components/ui/Table';
import { formatCurrency } from '../../lib/utils';

export default function FleetList() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [isGrid, setIsGrid] = useState(true);
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { machinesQuery, categoriesQuery, saveMachineMutation } = useMachines({
    search: debouncedSearch,
    categoryId,
    status,
  });

  const machines = machinesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const onSubmit = async (values: MachineFormValues) => {
    try {
      const { photo_url, ...payload } = values;
      await saveMachineMutation.mutateAsync({
        ...payload,
        photo_urls: photo_url ? [photo_url] : null,
        company_id: profile?.company_id ?? undefined,
      } as any);
      toast.success('Machine saved');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save machine');
    }
  };

  const sortedMachines = useMemo(
    () => [...machines].sort((a, b) => a.name.localeCompare(b.name)),
    [machines],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Fleet</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={isGrid ? 'primary' : 'secondary'} onClick={() => setIsGrid(true)}>
            <LayoutGrid className="size-4" />
            Grid
          </Button>
          <Button variant={!isGrid ? 'primary' : 'secondary'} onClick={() => setIsGrid(false)}>
            <List className="size-4" />
            Table
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add Machine
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search machines" />
        <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="on_hire">On Hire</option>
          <option value="under_repair">Under Repair</option>
          <option value="in_transit">In Transit</option>
          <option value="decommissioned">Decommissioned</option>
        </Select>
      </div>

      {machinesQuery.isLoading ? (
        <p className="text-sm text-slate-500">Loading fleet...</p>
      ) : !sortedMachines.length ? (
        <EmptyState
          title="No machines yet"
          description="Add your first machine to get started"
          actionLabel="Add Machine"
          onAction={() => setOpen(true)}
        />
      ) : isGrid ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sortedMachines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      ) : (
        <TableContainer>
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Make/Model</th>
                <th className="p-3">Year</th>
                <th className="p-3">Status</th>
                <th className="p-3">Daily rate</th>
                <th className="p-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {sortedMachines.map((machine) => (
                <tr key={machine.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <a href={`/fleet/${machine.id}`} className="font-semibold text-blue-600 hover:text-blue-700">
                      {machine.name}
                    </a>
                  </td>
                  <td className="p-3">{machine.machine_categories?.name ?? '-'}</td>
                  <td className="p-3">{machine.make ?? '-'} {machine.model ?? ''}</td>
                  <td className="p-3">{machine.year ?? '-'}</td>
                  <td className="p-3"><StatusBadge status={machine.status} /></td>
                  <td className="p-3">{formatCurrency(Number(machine.daily_rate ?? 0))}</td>
                  <td className="p-3">{machine.location ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Machine">
        <MachineForm
          categories={categories}
          onSubmit={onSubmit}
          loading={saveMachineMutation.isPending}
        />
      </Modal>
    </div>
  );
}
