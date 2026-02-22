import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CustomerForm, type CustomerFormValues } from '../customers/CustomerForm';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { StatusBadge } from '../ui/StatusBadge';
import { LineItemsTable, type LineItemValue } from '../invoices/LineItemsTable';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { getConflictedMachineIds, getEffectiveMachineStatus, isMachineBookable } from '../../lib/machineAvailability';
import { DEPOSIT_TYPES, PAYMENT_PLANS, RATE_TYPES } from '../../lib/constants';
import type { BookingChargeTemplate, Customer, Machine } from '../../types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WizardValues {
  machine: Machine | null;
  customer: Customer | null;
  startDate: string;
  endDate: string;
  rateType: string;
  rateAmount: number;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentPlan: string;
  depositType: string;
  depositValue: number;
  chargeItems: LineItemValue[];
  notes: string;
}

interface ConflictingBooking {
  machine_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface NewBookingWizardProps {
  machines: Machine[];
  customers: Customer[];
  /** Existing confirmed bookings used to detect date conflicts in Step 1. */
  existingBookings?: ConflictingBooking[];
  defaultChargeTemplates?: BookingChargeTemplate[];
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
  existingBookings = [],
  defaultChargeTemplates = [],
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
    deliveryLat: null,
    deliveryLng: null,
    paymentPlan: 'on_completion',
    depositType: 'fixed',
    depositValue: 0,
    chargeItems: defaultChargeTemplates.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
    })),
    notes: '',
  });

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const bookableMachines = machines.filter(
    (m) => isMachineBookable(m) || m.id === defaultMachineId,
  );

  /** IDs of machines that have a confirmed booking overlapping the selected dates. */
  const conflictedMachineIds = useMemo(() => {
    if (!values.startDate) return new Set<string>();
    return getConflictedMachineIds(existingBookings, values.startDate, values.endDate || values.startDate, ['confirmed']);
  }, [existingBookings, values.startDate, values.endDate]);

  const onHireTodayMachineIds = useMemo(
    () => getConflictedMachineIds(existingBookings, todayDate, todayDate, ['confirmed']),
    [existingBookings, todayDate],
  );

  const selectedMachineId = values.machine?.id ?? null;

  // If dates are changed to a conflicting range, force re-selection.
  useEffect(() => {
    if (!selectedMachineId) {
      return;
    }
    if (!conflictedMachineIds.has(selectedMachineId)) {
      return;
    }
    setValues((current) => (
      current.machine?.id === selectedMachineId
        ? { ...current, machine: null }
        : current
    ));
  }, [conflictedMachineIds, selectedMachineId]);

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

  const hireSubtotal = values.rateAmount * estimatedDays;
  const extrasSubtotal = values.chargeItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
  const estimatedTotal = hireSubtotal + extrasSubtotal;
  const estimatedDeposit = useMemo(() => {
    if (values.paymentPlan !== 'deposit') {
      return 0;
    }
    if (values.depositType === 'percent') {
      const boundedPercent = Math.min(Math.max(values.depositValue, 0), 100);
      return (estimatedTotal * boundedPercent) / 100;
    }
    return Math.max(values.depositValue, 0);
  }, [estimatedTotal, values.paymentPlan, values.depositType, values.depositValue]);

  const handleMachineSelect = (machine: Machine) => {
    if (conflictedMachineIds.has(machine.id)) {
      toast.error(`${machine.name} is already booked for those dates. Pick different dates or another machine.`);
      return;
    }
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
          <p className="text-sm text-slate-500">Pick dates first to see what's available</p>
        </div>

        {/* Date pickers — selecting here filters machine availability */}
        <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-violet-100 bg-violet-50 p-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-violet-600">
              Start date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={values.startDate}
              onChange={(e) => setValues((v) => ({
                ...v,
                startDate: e.target.value,
                // auto-fill or reset endDate when startDate changes
                endDate: v.endDate && v.endDate >= e.target.value ? v.endDate : e.target.value,
              }))}
              className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-violet-600">
              End date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={values.endDate}
              min={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
              className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>
          {values.startDate && conflictedMachineIds.size > 0 ? (
            <p className="sm:col-span-2 text-xs text-amber-700">
              {conflictedMachineIds.size} machine{conflictedMachineIds.size > 1 ? 's are' : ' is'} already booked for these dates and shown below.
            </p>
          ) : null}
        </div>

        {bookableMachines.length === 0 ? (
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
            {bookableMachines.map((machine) => {
              const isSelected = values.machine?.id === machine.id;
              const isConflicted = values.startDate ? conflictedMachineIds.has(machine.id) : false;
              const photo = machine.photo_urls?.[0];
              return (
                <button
                  key={machine.id}
                  type="button"
                  data-testid="machine-card"
                  data-machine-id={machine.id}
                  disabled={isConflicted}
                  onClick={() => handleMachineSelect(machine)}
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                    isConflicted
                      ? 'cursor-not-allowed border-amber-200 bg-amber-50/50 opacity-75'
                      : isSelected
                      ? 'border-violet-500 shadow-lg shadow-violet-500/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                  )}
                >
                  {isSelected && !isConflicted && (
                    <div className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full bg-violet-600 shadow-lg">
                      <Check className="size-4 text-white" />
                    </div>
                  )}
                  {isConflicted && (
                    <div className="absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Booked
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
                      <StatusBadge
                        status={getEffectiveMachineStatus(
                          machine,
                          values.startDate ? conflictedMachineIds : onHireTodayMachineIds,
                        )}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!values.startDate && bookableMachines.length > 0 && (
          <p className="text-center text-xs text-amber-600">
            Enter a start date above to check machine availability, then select a machine.
          </p>
        )}
        <WizardNav
          onNext={() => setStep(2)}
          nextDisabled={
            !values.machine
            || !values.startDate
            || !values.endDate
            || (values.machine ? conflictedMachineIds.has(values.machine.id) : false)
          }
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
          <p className="text-sm text-slate-500">Set rate, payment plan, and extras</p>
        </div>

        {/* Conflict warning: re-check if the selected machine is now conflicted with the chosen dates */}
        {values.machine && values.startDate && conflictedMachineIds.has(values.machine.id) && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Date conflict detected</p>
              <p className="text-amber-700">
                {values.machine.name} has a confirmed booking overlapping your selected dates.{' '}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-semibold underline hover:no-underline"
                >
                  Go back to choose a different machine.
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Dates — show compact summary if set in Step 1, or input fields if missing */}
        {values.startDate ? (
          <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Hire dates</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {values.startDate}
                {values.endDate && values.endDate !== values.startDate ? ` → ${values.endDate}` : ''}
                <span className="ml-2 text-sm font-normal text-violet-600">
                  ({estimatedDays} day{estimatedDays !== 1 ? 's' : ''})
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
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
                End date <span className="text-red-500">*</span>
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
        )}

        {/* Conflict warning: machine has a confirmed booking overlapping these dates */}
        {values.startDate && values.machine && conflictedMachineIds.has(values.machine.id) ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Machine conflict detected</p>
              <p className="text-xs text-amber-600">
                {values.machine.name} has a confirmed booking overlapping these dates.{' '}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-semibold underline hover:text-amber-800"
                >
                  Go back to choose a different machine.
                </button>
              </p>
            </div>
          </div>
        ) : null}

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

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Payment plan</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENT_PLANS.map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => setValues((v) => ({ ...v, paymentPlan: plan }))}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors',
                  values.paymentPlan === plan
                    ? 'border-violet-300 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {plan === 'deposit' ? 'Deposit' : plan === 'upfront' ? 'Upfront' : 'On completion'}
              </button>
            ))}
          </div>
          {values.paymentPlan === 'deposit' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Deposit type</label>
                  <select
                    value={values.depositType}
                    onChange={(event) => setValues((v) => ({ ...v, depositType: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  >
                    {DEPOSIT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type === 'fixed' ? 'Fixed amount ($)' : 'Percentage (%)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    {values.depositType === 'percent' ? 'Deposit %' : 'Deposit amount ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={values.depositType === 'percent' ? 100 : undefined}
                    value={values.depositValue}
                    onChange={(event) => setValues((v) => ({ ...v, depositValue: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  />
                </div>
              </div>
              {estimatedDeposit > 0 ? (
                <p className="text-xs font-medium text-slate-600">
                  = <span className="text-violet-700 font-bold">{formatCurrency(estimatedDeposit)}</span> deposit required
                  {values.depositType === 'percent' ? ` (${values.depositValue}% of ${formatCurrency(estimatedTotal)})` : ''}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Extras</h3>
          <LineItemsTable
            items={values.chargeItems}
            onChange={(items) => setValues((v) => ({ ...v, chargeItems: items }))}
          />
        </div>

        {/* Live total estimate */}
        {values.startDate && (
          <div className="rounded-xl bg-violet-50 px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-700">Estimated total</span>
              <span className="text-lg font-bold text-violet-900">{formatCurrency(estimatedTotal)}</span>
            </div>
            <p className="text-xs text-violet-500">
              Hire: {estimatedDays} day{estimatedDays !== 1 ? 's' : ''} × {formatCurrency(values.rateAmount)}/{values.rateType}
              {extrasSubtotal > 0 ? ` + Extras: ${formatCurrency(extrasSubtotal)}` : ''}
            </p>
            <div className="border-t border-violet-200 mt-2 pt-2 space-y-0.5">
              <div className="flex items-center justify-between text-xs text-violet-500">
                <span>Subtotal (ex GST)</span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-violet-500">
                <span>GST (10%)</span>
                <span>{formatCurrency(estimatedTotal * 0.1)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-violet-800">
                <span>Total inc. GST</span>
                <span>{formatCurrency(estimatedTotal * 1.1)}</span>
              </div>
            </div>
            {values.paymentPlan === 'deposit' ? (
              <p className="text-xs font-semibold text-violet-700 pt-1 border-t border-violet-200">
                Deposit due before confirmation: {formatCurrency(estimatedDeposit)}
              </p>
            ) : values.paymentPlan === 'upfront' ? (
              <p className="text-xs font-semibold text-violet-700 pt-1 border-t border-violet-200">
                Full payment required before confirmation: {formatCurrency(estimatedTotal * 1.1)}
              </p>
            ) : null}
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
                onChange={(v) => setValues((vals) => ({
                  ...vals,
                  deliveryAddress: v,
                  deliveryLat: null,
                  deliveryLng: null,
                }))}
                onSelect={(suggestion) =>
                  setValues((vals) => ({
                    ...vals,
                    deliveryAddress: suggestion.fullAddress,
                    deliveryLat: suggestion.latitude ?? null,
                    deliveryLng: suggestion.longitude ?? null,
                  }))
                }
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
          nextDisabled={!values.startDate || !values.endDate}
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
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(estimatedTotal * 1.1)} <span className="text-sm font-normal text-slate-400">inc. GST</span></p>
            <p className="text-xs text-slate-400">
              Subtotal: {formatCurrency(estimatedTotal)} + GST: {formatCurrency(estimatedTotal * 0.1)}
              {extrasSubtotal > 0 ? ` (Hire: ${formatCurrency(hireSubtotal)} + Extras: ${formatCurrency(extrasSubtotal)})` : ''}
            </p>
          </ReviewRow>
        </div>
        <div className="p-4">
          <ReviewRow icon={<FileText className="size-4 text-violet-500" />} label="Payment">
            <p className="text-sm font-semibold text-slate-900">
              {values.paymentPlan === 'deposit'
                ? 'Deposit required before confirmation'
                : values.paymentPlan === 'upfront'
                  ? 'Full payment required before confirmation'
                  : 'Payment due on completion'}
            </p>
            {values.paymentPlan === 'deposit' ? (
              <p className="text-xs text-slate-500">Deposit amount: {formatCurrency(estimatedDeposit)}</p>
            ) : null}
          </ReviewRow>
        </div>
        {values.chargeItems.length > 0 ? (
          <div className="p-4">
            <ReviewRow icon={<FileText className="size-4 text-sky-500" />} label="Extras">
              <div className="space-y-1">
                {values.chargeItems.map((item, index) => (
                  <p key={`${item.description}-${index}`} className="text-xs text-slate-600">
                    {item.description || 'Extra'} - {item.quantity} x {formatCurrency(item.unit_price)}
                  </p>
                ))}
              </div>
            </ReviewRow>
          </div>
        ) : null}
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
        This job will be saved as <strong>Pending</strong>. Record any required payment on the job page, then confirm it to put the machine on hire.
      </p>

      {values.machine && conflictedMachineIds.has(values.machine.id) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">Cannot create — machine already booked</p>
            <p className="text-red-700">
              {values.machine.name} has a confirmed booking overlapping these dates.{' '}
              <button type="button" onClick={() => setStep(1)} className="font-semibold underline hover:no-underline">
                Go back to fix it.
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          className="w-full"
          loading={loading}
          disabled={!!(values.machine && conflictedMachineIds.has(values.machine.id))}
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
