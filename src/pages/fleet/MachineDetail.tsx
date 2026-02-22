import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useMachine, useMachines } from '../../hooks/useMachines';
import { createMaintenance, getMaintenanceByMachine, upsertMachine } from '../../services/api';
import { MachineForm, type MachineFormValues } from '../../components/fleet/MachineForm';
import { MachineStatusDropdown } from '../../components/fleet/MachineStatusDropdown';
import { PhotoUpload } from '../../components/fleet/PhotoUpload';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Machine } from '../../types';

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'service',
    description: '',
    date_performed: new Date().toISOString().split('T')[0],
    next_due_date: '',
    cost: '',
    performed_by: '',
  });

  const machineQuery = useMachine(id ?? '');
  const machine = machineQuery.data;
  const { categoriesQuery, updateStatusMutation } = useMachines();

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => getMaintenanceByMachine(id ?? ''),
    enabled: Boolean(id),
  });

  const saveMachineMutation = useMutation({
    mutationFn: (values: Partial<Machine>) => upsertMachine(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['machine', id] });
      void queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createMaintenance(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
    },
  });

  const bookingHistoryQuery = useQuery({
    queryKey: ['bookings', 'machine', id],
    queryFn: async () => {
      const { getBookings } = await import('../../services/api');
      return getBookings({ machineId: id });
    },
    enabled: Boolean(id),
  });

  const onStatusChange = async (status: string) => {
    if (!id) {
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success('Machine status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const onSaveMachine = async (values: MachineFormValues) => {
    if (!machine) {
      return;
    }
    try {
      const { photo_url, ...payload } = values;
      const machinePayload: Partial<Machine> = {
        ...machine,
        ...payload,
        photo_urls: photo_url ? [photo_url] : null,
      };
      await saveMachineMutation.mutateAsync(machinePayload);
      toast.success('Machine updated');
      setEditOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update machine');
    }
  };

  const onAddMaintenance = async () => {
    if (!machine || !profile?.company_id) {
      return;
    }

    try {
      await maintenanceMutation.mutateAsync({
        machine_id: machine.id,
        company_id: profile.company_id,
        type: maintenanceForm.type,
        description: maintenanceForm.description,
        date_performed: maintenanceForm.date_performed,
        next_due_date: maintenanceForm.next_due_date || null,
        cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : null,
        performed_by: maintenanceForm.performed_by || null,
      });
      toast.success('Maintenance record added');
      setMaintenanceOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save maintenance');
    }
  };

  const rates = useMemo(
    () => [
      { label: 'Hourly', value: machine?.hourly_rate },
      { label: 'Daily', value: machine?.daily_rate },
      { label: 'Weekend', value: machine?.weekend_rate },
      { label: 'Weekly', value: machine?.weekly_rate },
      { label: 'Monthly', value: machine?.monthly_rate },
    ],
    [machine],
  );

  if (!machine && !machineQuery.isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Machine not found.</p>
        <Button className="mt-3" variant="secondary" onClick={() => navigate('/fleet')}>
          Back to Fleet
        </Button>
      </Card>
    );
  }

  if (machineQuery.isLoading || !machine) {
    return <p className="text-sm text-slate-500">Loading machine...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{machine.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={machine.status} />
            <span className="text-sm text-slate-500">{machine.machine_categories?.name}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <MachineStatusDropdown value={machine.status} onChange={onStatusChange} />
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Machine Details</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p><span className="font-medium">Make:</span> {machine.make ?? '-'}</p>
            <p><span className="font-medium">Model:</span> {machine.model ?? '-'}</p>
            <p><span className="font-medium">Year:</span> {machine.year ?? '-'}</p>
            <p><span className="font-medium">Serial:</span> {machine.serial_number ?? '-'}</p>
            <p><span className="font-medium">Registration:</span> {machine.registration ?? '-'}</p>
            <p><span className="font-medium">Location:</span> {machine.location ?? '-'}</p>
          </div>
          <p className="mt-4 text-sm text-slate-600">{machine.notes || 'No notes added yet.'}</p>
          <div className="mt-4 max-w-xs">
            <PhotoUpload onUpload={() => toast.info('Photo upload wired to Supabase bucket in integration step.')} />
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Rates</h3>
          <div className="mt-3 space-y-2 text-sm">
            {rates.map((rate) => (
              <div key={rate.label} className="flex justify-between">
                <span className="text-slate-600">{rate.label}</span>
                <span className="font-medium text-slate-900">{formatCurrency(Number(rate.value ?? 0))}</span>
              </div>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={machine.cross_hire_available} readOnly />
            Available for cross-hire
          </label>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Booking History</h3>
          </div>
          <div className="space-y-3">
            {(bookingHistoryQuery.data ?? []).length ? (
              (bookingHistoryQuery.data ?? []).map((booking) => (
                <Link key={booking.id} to={`/bookings/${booking.id}`} className="block rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{booking.customers?.name}</p>
                  <p className="text-sm text-slate-600">{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</p>
                  <StatusBadge status={booking.status} />
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No bookings yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Maintenance</h3>
            <Button size="sm" onClick={() => setMaintenanceOpen(true)}>
              <Plus className="size-4" />
              Add Record
            </Button>
          </div>
          <div className="space-y-3">
            {(maintenanceQuery.data ?? []).length ? (
              (maintenanceQuery.data ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.description}</p>
                    <span className="text-xs uppercase text-slate-500">{item.type}</span>
                  </div>
                  <p className="text-sm text-slate-600">Performed {formatDate(item.date_performed)}</p>
                  {item.cost ? <p className="text-sm text-slate-600">Cost: {formatCurrency(item.cost)}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No maintenance records yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Modal open={editOpen} title="Edit Machine" onClose={() => setEditOpen(false)}>
        <MachineForm
          categories={categoriesQuery.data ?? []}
          defaultValues={machine}
          onSubmit={onSaveMachine}
          loading={saveMachineMutation.isPending}
        />
      </Modal>

      <Modal open={maintenanceOpen} title="Add Maintenance Record" onClose={() => setMaintenanceOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <Select
              value={maintenanceForm.type}
              onChange={(event) => setMaintenanceForm((state) => ({ ...state, type: event.target.value }))}
            >
              <option value="service">Service</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="certification">Certification</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Input
              value={maintenanceForm.description}
              onChange={(event) =>
                setMaintenanceForm((state) => ({ ...state, description: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date performed</label>
              <Input
                type="date"
                value={maintenanceForm.date_performed}
                onChange={(event) =>
                  setMaintenanceForm((state) => ({ ...state, date_performed: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Next due</label>
              <Input
                type="date"
                value={maintenanceForm.next_due_date}
                onChange={(event) =>
                  setMaintenanceForm((state) => ({ ...state, next_due_date: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cost</label>
              <Input
                type="number"
                value={maintenanceForm.cost}
                onChange={(event) => setMaintenanceForm((state) => ({ ...state, cost: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Performed by</label>
              <Input
                value={maintenanceForm.performed_by}
                onChange={(event) =>
                  setMaintenanceForm((state) => ({ ...state, performed_by: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onAddMaintenance} loading={maintenanceMutation.isPending}>
              Save Maintenance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
