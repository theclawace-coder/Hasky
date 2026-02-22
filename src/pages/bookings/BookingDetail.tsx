import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Pencil, Plus, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useBooking, useBookings } from '../../hooks/useBookings';
import { useCustomers } from '../../hooks/useCustomers';
import { useMachines } from '../../hooks/useMachines';
import { useExpenses } from '../../hooks/useAccounting';
import { getInvoicesByBookingId } from '../../services/api';
import { BookingStatusBar } from '../../components/bookings/BookingStatusBar';
import { BookingForm, type BookingFormValues } from '../../components/bookings/BookingForm';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BOOKING_STATUS_LABELS, EXPENSE_CATEGORIES } from '../../lib/constants';
import { updateQuoteStatus } from '../../services/api';
import type { BookingChargeItem, BookingMachine, ExpenseCategory } from '../../types';

const RETURN_CHECKLIST = [
  'Machine returned to yard / agreed location',
  'Fuel level checked and topped up if required',
  'No new damage observed (body, attachments, tyres)',
  'All attachments and accessories returned',
  'Hours meter reading recorded',
];

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bookingQuery = useBooking(id ?? '');
  const {
    updateLifecycleMutation,
    generateInvoiceMutation,
    markDepositPaidMutation,
    markPaidInFullMutation,
    saveBookingMutation,
  } = useBookings();
  const { customersQuery } = useCustomers();
  const { machinesQuery } = useMachines();

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(RETURN_CHECKLIST.map(() => false));
  const [editOpen, setEditOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [logCostOpen, setLogCostOpen] = useState(false);
  const [costForm, setCostForm] = useState({ category: 'Fuel' as ExpenseCategory, description: '', amount: '' });

  const { expensesQuery, upsertMutation: logCostMutation } = useExpenses({ bookingId: id ?? '' });

  const bookingInvoicesQuery = useQuery({
    queryKey: ['invoices', 'booking', id],
    queryFn: () => getInvoicesByBookingId(id!),
    enabled: Boolean(id),
  });

  const booking = bookingQuery.data;
  const chargeItems = useMemo(
    () => (((booking as { booking_charge_items?: BookingChargeItem[] } | null)?.booking_charge_items) ?? []),
    [booking],
  );

  const bookingMachines = useMemo(
    () => (((booking as { booking_machines?: BookingMachine[] } | null)?.booking_machines) ?? [])
      .slice()
      .sort((a, b) => a.machine_order - b.machine_order),
    [booking],
  );

  const totalAmount = Number(booking?.total_amount ?? booking?.rate_amount ?? 0);
  const jobCosts   = (expensesQuery.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const jobRevenue = totalAmount;
  const jobProfit  = jobRevenue - jobCosts;
  const jobMargin  = jobRevenue > 0 ? Math.round((jobProfit / jobRevenue) * 100) : null;
  const depositDue = Number(booking?.deposit_amount ?? 0);
  const depositPaid = Number(booking?.deposit_paid_amount ?? 0);
  const depositOutstanding = Math.max(depositDue - depositPaid, 0);
  const depositSatisfied = depositOutstanding <= 0;
  const bookingInvoices = bookingInvoicesQuery.data ?? [];
  const invoicesPaid = bookingInvoices.length > 0 && bookingInvoices.every((inv) => inv.status === 'paid');
  const fullPaid = Boolean(booking?.paid_in_full_date) || invoicesPaid;
  const confirmationPaymentSatisfied = booking?.payment_plan === 'upfront'
    ? fullPaid
    : booking?.payment_plan === 'deposit'
      ? depositSatisfied
      : true;

  if (!booking && !bookingQuery.isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Booking not found.</p>
      </Card>
    );
  }

  const handleStatusChange = async (bookingStatus: string, machineStatus: string) => {
    if (!id) return;
    try {
      await updateLifecycleMutation.mutateAsync({ bookingId: id, bookingStatus, machineStatus });
      // When a job is confirmed, mark its linked quote as accepted
      if (bookingStatus === 'confirmed' && booking?.quote_id) {
        try {
          await updateQuoteStatus(booking.quote_id, 'accepted');
        } catch {
          console.warn('Could not update linked quote status');
        }
      }
      toast.success('Booking updated');
      void bookingQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update booking');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!id) return;
    try {
      const invoiceId = await generateInvoiceMutation.mutateAsync(id);
      toast.success('Draft invoice created');
      navigate(`/invoices/${invoiceId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoice');
    }
  };

  const handleMarkDepositPaid = async () => {
    if (!id || !depositDue) return;
    try {
      await markDepositPaidMutation.mutateAsync({ bookingId: id, amount: depositOutstanding });
      toast.success('Deposit marked paid');
      void bookingQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark deposit paid');
    }
  };

  const handleMarkFullPaid = async () => {
    if (!id) return;
    try {
      await markPaidInFullMutation.mutateAsync({ bookingId: id });
      toast.success('Payment marked in full');
      void bookingQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark payment');
    }
  };

  const handleCompleteHire = () => {
    setChecklist(RETURN_CHECKLIST.map(() => false));
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    setCompleteModalOpen(false);
    await handleStatusChange('completed', 'available');
  };

  const handleConfirmCancel = async () => {
    setCancelConfirmOpen(false);
    await handleStatusChange('cancelled', 'available');
  };

  const handleEditSave = async (values: BookingFormValues) => {
    if (!booking) return;
    try {
      await saveBookingMutation.mutateAsync({
        payload: { ...values, id: booking.id, company_id: booking.company_id },
        chargeItems: chargeItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      toast.success('Job updated');
      setEditOpen(false);
      void bookingQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update job');
    }
  };

  if (bookingQuery.isLoading || !booking) {
    return <p className="text-sm text-slate-500">Loading booking...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            {booking.booking_number ?? `Job #${booking.id.slice(0, 8)}`}
          </h2>
          <div className="flex items-center gap-2">
            {fullPaid ? (
              <StatusBadge status="paid" label="Paid" />
            ) : (
              <StatusBadge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status]} />
            )}
            {(booking.status === 'quote' || booking.status === 'confirmed') ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <BookingStatusBar status={booking.status} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Machine and Customer</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {/* Multi-machine display: show junction table rows if available, fall back to primary machine */}
            {bookingMachines.length > 0 ? (
              <div>
                <p className="font-medium text-slate-700">{bookingMachines.length === 1 ? 'Machine:' : 'Machines:'}</p>
                <div className="mt-1 rounded-lg border border-slate-100 overflow-hidden">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Name</th>
                        <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Rate type</th>
                        <th className="px-3 py-1.5 text-right font-semibold text-slate-500">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingMachines.map((bm) => (
                        <tr key={bm.id} className="border-t border-slate-100">
                          <td className="px-3 py-1.5 font-medium text-slate-800">{bm.machines?.name ?? '-'}</td>
                          <td className="px-3 py-1.5 text-slate-600">{bm.rate_type ?? '-'}</td>
                          <td className="px-3 py-1.5 text-right text-slate-600">{formatCurrency(bm.rate_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p><span className="font-medium">Machine:</span> {booking.machines?.name ?? '-'}</p>
            )}
            <p><span className="font-medium">Customer:</span> {booking.customers?.name}</p>
            <p><span className="font-medium">Start:</span> {formatDate(booking.start_date)}</p>
            <p><span className="font-medium">End:</span> {formatDate(booking.end_date)}</p>
            <p><span className="font-medium">Rate:</span> {formatCurrency(booking.rate_amount)} ({booking.rate_type})</p>
            <p><span className="font-medium">Hire subtotal:</span> {formatCurrency(Number(booking.hire_subtotal ?? booking.rate_amount))}</p>
            <p><span className="font-medium">Extras subtotal:</span> {formatCurrency(Number(booking.extras_subtotal ?? 0))}</p>
            <p><span className="font-medium">Total (ex GST):</span> {formatCurrency(totalAmount)}</p>
            <p><span className="font-medium">Total (inc. GST):</span> {formatCurrency(totalAmount * 1.1)}</p>
            <p><span className="font-medium">Payment plan:</span> {booking.payment_plan}</p>
            {booking.payment_plan === 'deposit' ? (
              <p><span className="font-medium">Deposit:</span> {formatCurrency(depositDue)} ({depositSatisfied ? 'paid' : 'pending'})</p>
            ) : null}
            {booking.paid_in_full_date ? (
              <p><span className="font-medium">Paid in full:</span> {formatDate(booking.paid_in_full_date)}</p>
            ) : null}
            <p><span className="font-medium">Delivery:</span> {booking.delivery_address ?? '-'}</p>
            <p><span className="font-medium">Notes:</span> {booking.notes ?? '-'}</p>
          </div>
          {chargeItems.length ? (
            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-800">Extras</p>
              <div className="mt-2 space-y-1">
                {chargeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-slate-600">
                    <span>{item.description} ({item.quantity} x {formatCurrency(item.unit_price)})</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Actions</h3>

          {/* ── Payment gate: prominent card when payment is required before confirming ── */}
          {booking.status === 'quote' && !confirmationPaymentSatisfied ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    {booking.payment_plan === 'deposit'
                      ? `Record the ${formatCurrency(depositOutstanding)} deposit before confirming`
                      : `Record full payment of ${formatCurrency(totalAmount)} before confirming`}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    Once payment is recorded, you can confirm the job and put the machine on hire.
                  </p>
                  <div className="mt-3">
                    {booking.payment_plan === 'deposit' ? (
                      <Button
                        onClick={() => void handleMarkDepositPaid()}
                        loading={markDepositPaidMutation.isPending}
                      >
                        <CheckCircle2 className="size-4" />
                        Mark {formatCurrency(depositOutstanding)} Deposit Received
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void handleMarkFullPaid()}
                        loading={markPaidInFullMutation.isPending}
                      >
                        <CheckCircle2 className="size-4" />
                        Mark {formatCurrency(totalAmount)} Payment Received
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {booking.status === 'quote' ? (
              <>
                <Button
                  onClick={() => void handleStatusChange('confirmed', 'on_hire')}
                  disabled={!confirmationPaymentSatisfied}
                >
                  Confirm Job
                </Button>
                <Button variant="danger" onClick={() => setCancelConfirmOpen(true)}>
                  Cancel Job
                </Button>
              </>
            ) : null}

            {booking.status === 'confirmed' ? (
              <>
                <Button variant="success" onClick={() => void handleCompleteHire()}>
                  Complete Hire
                </Button>
                <Button variant="danger" onClick={() => setCancelConfirmOpen(true)}>
                  Cancel Job
                </Button>
              </>
            ) : null}

            {(booking.status === 'confirmed' || booking.status === 'completed') ? (
              fullPaid ? (
                <div className="relative">
                  <Button variant="secondary" disabled className="opacity-50">
                    Generate Invoice
                  </Button>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    PAID
                  </span>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => void handleGenerateInvoice()}
                  loading={generateInvoiceMutation.isPending}
                >
                  Generate Invoice
                </Button>
              )
            ) : null}
          </div>
        </Card>
      </div>

      {/* ── Job P&L ── */}
      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Job P&L</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Revenue</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(jobRevenue)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Job Costs</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(jobCosts)}</p>
          </div>
          <div className={`rounded-xl p-3 ${jobProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className="text-xs text-slate-500">Net Profit</p>
            <p className={`text-lg font-bold ${jobProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatCurrency(jobProfit)}
            </p>
          </div>
          <div className={`rounded-xl p-3 ${(jobMargin ?? 0) >= 50 ? 'bg-emerald-50' : (jobMargin ?? 0) >= 20 ? 'bg-amber-50' : 'bg-red-50'}`}>
            <p className="text-xs text-slate-500">Margin</p>
            <p className={`text-lg font-bold ${(jobMargin ?? 0) >= 50 ? 'text-emerald-700' : (jobMargin ?? 0) >= 20 ? 'text-amber-700' : 'text-red-600'}`}>
              {jobMargin !== null ? `${jobMargin}%` : '—'}
            </p>
          </div>
        </div>
        {(expensesQuery.data ?? []).length > 0 && (
          <div className="mt-3 space-y-1.5">
            {expensesQuery.data!.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm">
                <span className="text-slate-700">
                  {e.description} <span className="text-xs text-slate-400">({e.category})</span>
                </span>
                <span className="font-medium text-slate-900">−{formatCurrency(Number(e.amount))}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={() => setLogCostOpen(true)}>
            <Plus className="size-3.5" />
            Log Cost
          </Button>
        </div>
      </Card>

      {/* ── Edit job modal ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Job">
        <BookingForm
          machines={machinesQuery.data ?? []}
          customers={customersQuery.data ?? []}
          defaultValues={booking}
          onSubmit={(values) => { void handleEditSave(values); }}
          loading={saveBookingMutation.isPending}
        />
      </Modal>

      {/* ── Cancel confirmation modal ── */}
      <Modal
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Cancel this job?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
              <p className="mt-0.5 text-xs text-red-600">
                The job will be marked as cancelled and the machine will be returned to available.
                Any recorded payments will remain in the payment history.
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => void handleConfirmCancel()}
              loading={updateLifecycleMutation.isPending}
            >
              <XCircle className="size-4" />
              Yes, cancel this job
            </Button>
            <Button variant="secondary" onClick={() => setCancelConfirmOpen(false)}>
              Go back
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Machine return checklist modal ── */}
      <Modal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Hire — Return Check"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Tick off each item before marking the hire as complete.
          </p>
          <div className="space-y-3">
            {RETURN_CHECKLIST.map((item, i) => (
              <label key={item} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checklist[i] ?? false}
                  onChange={(e) =>
                    setChecklist((prev) => {
                      const next = [...prev];
                      next[i] = e.target.checked;
                      return next;
                    })
                  }
                  className="mt-0.5 size-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-700">{item}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="success"
              className="flex-1"
              onClick={() => void handleConfirmComplete()}
              loading={updateLifecycleMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              Confirm Complete
            </Button>
            <Button variant="secondary" onClick={() => setCompleteModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Log Cost modal ── */}
      <Modal open={logCostOpen} onClose={() => setLogCostOpen(false)} title="Log Job Cost">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <Select
              value={costForm.category}
              onChange={(e) => setCostForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            >
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Input
              value={costForm.description}
              onChange={(e) => setCostForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Fuel delivery run"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount ($)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costForm.amount}
              onChange={(e) => setCostForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLogCostOpen(false)}>Cancel</Button>
            <Button
              loading={logCostMutation.isPending}
              onClick={async () => {
                if (!id || !booking || !costForm.description || !costForm.amount) {
                  toast.error('Description and amount are required');
                  return;
                }
                try {
                  await logCostMutation.mutateAsync({
                    booking_id: id,
                    machine_id: booking.machine_id,
                    company_id: booking.company_id,
                    category: costForm.category,
                    description: costForm.description,
                    amount: parseFloat(costForm.amount),
                    gst_amount: 0,
                    date: new Date().toISOString().split('T')[0],
                  });
                  toast.success('Cost recorded');
                  setCostForm({ category: 'Fuel', description: '', amount: '' });
                  setLogCostOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to save cost');
                }
              }}
            >
              Save Cost
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
