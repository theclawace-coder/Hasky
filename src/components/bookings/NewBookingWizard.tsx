import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  User,
  Calendar,
  FileText,
  Plus,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CustomerForm, type CustomerFormValues } from '../customers/CustomerForm';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { RATE_TYPES } from '../../lib/constants';
import type { Customer, Machine } from '../../types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WizardValues {
  machine: Machine | null;
  customer: Customer | null;
  startDate: string;
  endDate: string;
  rateType: string;
  rateAmount: number;
  deliveryAddress: string;
  notes: string;
}

interface NewBookingWizardProps {
  machines: Machine[];
  customers: Customer[];
  defaultMachineId?: string;
  defaultStartDate?: string;
  onSubmit: (values: WizardValues) => Promise<void>;
  onCreateCustomer: (values: CustomerFormValues) => Promise<Customer>;
  createCustomerLoading?: boolean;
  loading?: boolean;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Equipment', icon: Truck },
  { n: 2, label: 'Client',    icon: User },
  { n: 3, label: 'Details',   icon: Calendar },
  { n: 4, label: 'Review',    icon: FileText },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                done   ? 'bg-violet-600 text-white'
                       : active ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400'
                       : 'bg-slate-100 text-slate-400',
              )}
            >
              {done ? <Check className="size-3.5" /> : s.n}
            </div>
            <span
              className={cn(
                'hidden text-xs font-medium sm:block',
                active ? 'text-slate-800' : 'text-slate-400',
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-4 sm:w-8', done ? 'bg-violet-400' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Footer nav ─────────────────────────────────────────────────────────────────

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Next',
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex gap-3 border-t border-slate-100 pt-4">
      {onBack && (
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
      )}
      <Button
        className="flex-1"
        onClick={onNext}
        disabled={nextDisabled}
        loading={loading}
      >
        {nextLabel}
        {!nextDisabled && !loading && <ChevronRight className="size-4" />}
      </Button>
    </div>
  );
}

// ── Review row ─────────────────────────────────────────────────────────────────

function ReviewRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        {children}
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function NewBookingWizard({
  machines,
  customers,
  defaultMachineId,
  defaultStartDate,
  onSubmit,
  onCreateCustomer,
  createCustomerLoading,
  loading,
}: NewBookingWizardProps) {
  const defaultMachine = defaultMachineId
    ? (machines.find((m) => m.id === defaultMachineId) ?? null)
    : null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(defaultMachine ? 2 : 1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  const [values, setValues] = useState<WizardValues>({
    machine: defaultMachine,
    customer: null,
    startDate: defaultStartDate ?? '',
    endDate: '',
    rateType: 'daily',
    rateAmount: defaultMachine ? Number(defaultMachine.daily_rate ?? 0) : 0,
    deliveryAddress: '',
    notes: '',
  });

  const availableMachines = machines.filter(
    (m) => m.status === 'available' || m.id === defaultMachineId,
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          !customerSearch ||
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          (c.contact_name ?? '').toLowerCase().includes(customerSearch.toLowerCase()),
      ),
    [customers, customerSearch],
  );

  const estimatedDays = useMemo(() => {
    if (!values.startDate) return 1;
    const start = new Date(values.startDate);
    const end = values.endDate ? new Date(values.endDate) : start;
    return Math.max(
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      1,
    );
  }, [values.startDate, values.endDate]);

  const estimatedTotal = values.rateAmount * estimatedDays;

  const handleMachineSelect = (machine: Machine) => {
    const rateMap: Record<string, number> = {
      daily:   Number(machine.daily_rate ?? 0),
      weekly:  Number(machine.weekly_rate ?? 0),
      monthly: Number(machine.monthly_rate ?? 0),
      hourly:  Number(machine.hourly_rate ?? 0),
    };
    setValues((v) => ({
      ...v,
      machine,
      rateAmount: rateMap[v.rateType] ?? Number(machine.daily_rate ?? 0),
    }));
  };

  const handleRateTypeChange = (type: string) => {
    const m = values.machine;
    const rateMap: Record<string, number> = {
      daily:   Number(m?.daily_rate ?? 0),
      weekly:  Number(m?.weekly_rate ?? 0),
      monthly: Number(m?.monthly_rate ?? 0),
      hourly:  Number(m?.hourly_rate ?? 0),
    };
    setValues((v) => ({ ...v, rateType: type, rateAmount: rateMap[type] ?? v.rateAmount }));
  };

  const handleCreateCustomer = async (cv: CustomerFormValues) => {
    const customer = await onCreateCustomer(cv);
    setValues((v) => ({ ...v, customer }));
    setCustomerModalOpen(false);
  };

  // ── Step 1: Machine ──────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="space-y-5">
        <StepIndicator current={1} />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Choose equipment</h2>
          <p className="text-sm text-slate-500">Which machine is going on hire?</p>
        </div>

        {availableMachines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <Truck className="size-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-600">No available machines</p>
            <p className="mt-1 text-sm text-slate-400">All machines are currently on hire or under repair</p>
            <Link
              to="/fleet"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Fleet
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {availableMachines.map((machine) => {
              const isSelected = values.machine?.id === machine.id;
              const photo = machine.photo_urls?.[0];
              return (
                <button
                  key={machine.id}
                  type="button"
                  onClick={() => handleMachineSelect(machine)}
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                    isSelected
                      ? 'border-violet-500 shadow-lg shadow-violet-500/15'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                  )}
                >
                  {isSelected && (
                    <div className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full bg-violet-600 shadow-lg">
                      <Check className="size-4 text-white" />
                    </div>
                  )}
                  <div className="flex h-32 items-center justify-center overflow-hidden bg-slate-100">
                    {photo ? (
                      <img src={photo} alt={machine.name} className="h-full w-full object-cover" />
                    ) : (
                      <Truck className="size-8 text-slate-300" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-slate-900">{machine.name}</p>
                    <p className="text-xs text-slate-500">
                      {machine.machine_categories?.name ?? 'Uncategorised'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-bold text-violet-700">
                        {formatCurrency(Number(machine.daily_rate ?? 0))}
                        <span className="text-xs font-normal text-slate-400">/day</span>
                      </p>
                      <StatusBadge status={machine.status} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <WizardNav
          onNext={() => setStep(2)}
          nextDisabled={!values.machine}
          nextLabel="Next: Choose Client"
        />
      </div>
    );
  }

  // ── Step 2: Customer ─────────────────────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="space-y-4">
        <StepIndicator current={2} />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Who's the client?</h2>
          <p className="text-sm text-slate-500">Select an existing client or add a new one</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search clients..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />
        </div>

        {/* Add new client */}
        <button
          type="button"
          onClick={() => setCustomerModalOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-emerald-300 px-4 py-3 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Plus className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Add new client</p>
            <p className="text-xs text-emerald-600">Create a client on the spot</p>
          </div>
        </button>

        {/* Client list */}
        <div className="space-y-2">
          {filteredCustomers.map((customer) => {
            const isSelected = values.customer?.id === customer.id;
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => setValues((v) => ({ ...v, customer }))}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all active:scale-[0.99]',
                  isSelected
                    ? 'border-sky-500 bg-sky-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <div>
                  <p className="font-semibold text-slate-900">{customer.name}</p>
                  {customer.contact_name && (
                    <p className="text-xs text-slate-500">{customer.contact_name}</p>
                  )}
                  {customer.phone && (
                    <p className="text-xs text-slate-400">{customer.phone}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500">
                    <Check className="size-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
          {filteredCustomers.length === 0 && customerSearch && (
            <p className="py-6 text-center text-sm text-slate-400">
              No clients matching "{customerSearch}"
            </p>
          )}
        </div>

        <WizardNav
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          nextDisabled={!values.customer}
          nextLabel="Next: Job Details"
        />

        <Modal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="New Client">
          <CustomerForm
            onSubmit={(cv) => { void handleCreateCustomer(cv); }}
            loading={createCustomerLoading}
          />
        </Modal>
      </div>
    );
  }

  // ── Step 3: Details ──────────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="space-y-5">
        <StepIndicator current={3} />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job details</h2>
          <p className="text-sm text-slate-500">Set the dates and hire rate</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Start date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              End date <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="date"
              value={values.endDate}
              min={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Rate type</label>
            <select
              value={values.rateType}
              onChange={(e) => handleRateTypeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            >
              {RATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Rate ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={values.rateAmount}
              onChange={(e) => setValues((v) => ({ ...v, rateAmount: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>
        </div>

        {/* Live total estimate */}
        {values.startDate && (
          <div className="rounded-xl bg-violet-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-700">Estimated total</span>
              <span className="text-lg font-bold text-violet-900">{formatCurrency(estimatedTotal)}</span>
            </div>
            <p className="text-xs text-violet-500">
              {estimatedDays} day{estimatedDays !== 1 ? 's' : ''} × {formatCurrency(values.rateAmount)}/{values.rateType}
            </p>
          </div>
        )}

        {/* Extra options toggle */}
        <button
          type="button"
          onClick={() => setShowExtra((x) => !x)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <MapPin className="size-4" />
          {showExtra ? 'Hide' : 'Add'} delivery address & notes
        </button>

        {showExtra && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Delivery address</label>
              <AddressAutocomplete
                value={values.deliveryAddress}
                onChange={(v) => setValues((vals) => ({ ...vals, deliveryAddress: v }))}
                placeholder="Search address or type manually"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notes</label>
              <textarea
                className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                value={values.notes}
                onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                placeholder="Any extra details for this job..."
              />
            </div>
          </div>
        )}

        <WizardNav
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          nextDisabled={!values.startDate}
          nextLabel="Review Job"
        />
      </div>
    );
  }

  // ── Step 4: Review & confirm ─────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <StepIndicator current={4} />
      <div>
        <h2 className="text-xl font-bold text-slate-900">Looks good?</h2>
        <p className="text-sm text-slate-500">Double-check everything then create the job</p>
      </div>

      <div className="space-y-0 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4">
          <ReviewRow icon={<Truck className="size-4 text-violet-500" />} label="Machine">
            <p className="font-bold text-slate-900">{values.machine?.name}</p>
            <p className="text-xs text-slate-500">{values.machine?.machine_categories?.name}</p>
          </ReviewRow>
        </div>
        <div className="p-4">
          <ReviewRow icon={<User className="size-4 text-sky-500" />} label="Client">
            <p className="font-bold text-slate-900">{values.customer?.name}</p>
            {values.customer?.phone && (
              <p className="text-xs text-slate-500">{values.customer.phone}</p>
            )}
          </ReviewRow>
        </div>
        <div className="p-4">
          <ReviewRow icon={<Calendar className="size-4 text-emerald-500" />} label="Dates">
            <p className="font-bold text-slate-900">
              {values.startDate}
              {values.endDate && values.endDate !== values.startDate ? ` → ${values.endDate}` : ''}
            </p>
            <p className="text-xs text-slate-500">
              {estimatedDays} day{estimatedDays !== 1 ? 's' : ''}
            </p>
          </ReviewRow>
        </div>
        <div className="p-4">
          <ReviewRow icon={<FileText className="size-4 text-orange-500" />} label="Estimated Total">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(estimatedTotal)}</p>
            <p className="text-xs text-slate-400">
              {formatCurrency(values.rateAmount)}/{values.rateType}
            </p>
          </ReviewRow>
        </div>
        {values.deliveryAddress && (
          <div className="p-4">
            <ReviewRow icon={<MapPin className="size-4 text-slate-400" />} label="Delivery">
              <p className="text-sm text-slate-700">{values.deliveryAddress}</p>
            </ReviewRow>
          </div>
        )}
        {values.notes && (
          <div className="p-4">
            <ReviewRow icon={<span className="text-slate-400 text-sm">📝</span>} label="Notes">
              <p className="text-sm text-slate-700">{values.notes}</p>
            </ReviewRow>
          </div>
        )}
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        This will be saved as a <strong>Quote</strong>. You can confirm it and create an invoice from the job detail page.
      </p>

      <div className="space-y-3">
        <Button
          className="w-full"
          loading={loading}
          onClick={() => { void onSubmit(values); }}
        >
          Create Job
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => setStep(3)}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
