import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Printer, Send, CheckCircle, ArrowLeft, Mail, Link2, DollarSign, Download, ExternalLink, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useInvoice, useInvoices } from '../../hooks/useInvoices';
import { createDocumentShareLink, downloadInvoicePdf, sendDocumentEmail, sendPaymentReminder } from '../../services/api';
import { InvoicePreview } from '../../components/invoices/InvoicePreview';
import { PaymentModal } from '../../components/payments/PaymentModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { dueDateStatus, formatCurrency } from '../../lib/utils';
import type { InvoiceItem } from '../../types';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { company } = useAuth();
  const { updateStatusMutation, recordPaymentMutation } = useInvoices();
  const invoiceQuery = useInvoice(id ?? '');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const invoice = invoiceQuery.data;

  const items = useMemo(
    () => ((invoice as { invoice_items?: InvoiceItem[] } | null)?.invoice_items ?? []),
    [invoice],
  );

  if (invoiceQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Invoice not found.</p>
        <Link to="/invoices" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Back to invoices
        </Link>
      </Card>
    );
  }

  const handleStatus = async (status: string) => {
    if (!id) return;
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success('Invoice updated');
      void invoiceQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!id || !invoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    try {
      await recordPaymentMutation.mutateAsync({ id, amount });
      const outstanding = invoice.total - (Number(invoice.paid_amount ?? 0) + amount);
      if (outstanding <= 0) {
        toast.success('Invoice fully paid');
      } else {
        toast.success(`${formatCurrency(amount)} recorded — ${formatCurrency(Math.max(outstanding, 0))} still outstanding`);
      }
      setRecordPaymentOpen(false);
      setPaymentAmount('');
      void invoiceQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await sendDocumentEmail('invoice', invoice.id, invoice.customers?.email ?? undefined);
      if (response.email_sent) {
        toast.success(response.to_email ? `Invoice emailed to ${response.to_email}` : 'Invoice email sent');
      } else {
        toast.info('Email service unavailable right now. A private invoice link was generated instead.');
      }
      void invoiceQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyingLink(true);
    try {
      const response = await createDocumentShareLink('invoice', invoice.id);
      if (!navigator?.clipboard) {
        throw new Error('Clipboard is not available in this browser');
      }
      await navigator.clipboard.writeText(response.share_url);
      toast.success('Private invoice link copied');
      void invoiceQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy private link');
    } finally {
      setCopyingLink(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoice_number);
      toast.success('Invoice PDF downloaded');
    } catch {
      // Edge Function not deployed — fall back to browser print
      toast.info('PDF service unavailable — opening print dialog');
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const response = await sendPaymentReminder(invoice.id);
      toast.success(`Payment reminder sent to ${response.to_email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const canPayOnline = invoice.status === 'sent' || invoice.status === 'overdue';
  const isPaid = invoice.status === 'paid' || invoice.status === 'cancelled';
  const alreadyPaid = Number(invoice.paid_amount ?? 0);
  const outstanding = Math.max(invoice.total - alreadyPaid, 0);

  return (
    <div className="space-y-4">
      <Card className="no-print">
        {/* ── Header: back link + invoice number + status ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              to="/invoices"
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{invoice.invoice_number}</h2>
                <StatusBadge status={invoice.status} />
                {(() => {
                  const dd = dueDateStatus(invoice.due_date, isPaid);
                  if (!dd) return null;
                  const cls = {
                    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    amber:   'bg-amber-50 text-amber-700 border-amber-200',
                    red:     'bg-red-50 text-red-700 border-red-200 font-semibold',
                    slate:   'bg-slate-50 text-slate-600 border-slate-200',
                  }[dd.color];
                  return (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
                      {dd.label}
                    </span>
                  );
                })()}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {invoice.customers?.name} — {formatCurrency(invoice.total)}
              </p>
              {/* View Job link */}
              {invoice.booking_id ? (
                <Link
                  to={`/bookings/${invoice.booking_id}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 hover:underline"
                >
                  <ExternalLink className="size-3" />
                  View Job
                </Link>
              ) : null}
            </div>
          </div>

          {/* ── Primary actions (what to do now) ── */}
          <div className="flex flex-col gap-3">
            {/* Row 1: payment actions — ordered by most-common first */}
            {!isPaid ? (
              <div className="flex flex-wrap gap-2">
                {/* Draft: prompt to send before anything else */}
                {invoice.status === 'draft' ? (
                  <Button
                    onClick={() => void handleStatus('sent')}
                    loading={updateStatusMutation.isPending}
                  >
                    <Send className="size-4" />
                    Mark as Sent
                  </Button>
                ) : null}

                {/* Record Payment — primary CTA, most common for EFT/cash tradies */}
                <Button
                  variant={invoice.status !== 'draft' ? 'primary' : 'secondary'}
                  onClick={() => { setPaymentAmount(''); setRecordPaymentOpen(true); }}
                >
                  <DollarSign className="size-4" />
                  Record Payment
                </Button>

                {/* Mark Fully Paid — secondary, skips partial-payment audit trail */}
                <Button
                  variant="secondary"
                  onClick={() => void handleStatus('paid')}
                  loading={updateStatusMutation.isPending}
                  title="Marks the full invoice as paid without recording a payment amount"
                >
                  <CheckCircle className="size-4" />
                  Mark Fully Paid
                </Button>

                {/* Pay Now (Stripe) — only for sent/overdue */}
                {canPayOnline ? (
                  <Button variant="secondary" onClick={() => setPaymentOpen(true)}>
                    <CreditCard className="size-4" />
                    Pay Online — {formatCurrency(outstanding)}
                  </Button>
                ) : invoice.status === 'draft' ? (
                  <Button
                    variant="secondary"
                    disabled
                    title="Mark invoice as Sent to enable online payment"
                  >
                    <CreditCard className="size-4" />
                    Pay Online
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle className="size-4" />
                Paid
              </div>
            )}

            {/* Row 2: share / export actions (compact) */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleSendEmail()}
                loading={sendingEmail}
              >
                <Mail className="size-3.5" />
                Email
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleCopyLink()}
                loading={copyingLink}
              >
                <Link2 className="size-3.5" />
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleDownloadPdf()}
                loading={downloadingPdf}
              >
                <Download className="size-3.5" />
                PDF
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.print()} className="no-print">
                <Printer className="size-3.5" />
                Print
              </Button>
              {/* Send Reminder — only for unpaid sent/overdue invoices */}
              {(invoice.status === 'sent' || invoice.status === 'overdue') ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleSendReminder()}
                  loading={sendingReminder}
                  title="Send a payment reminder email to the customer"
                >
                  <Bell className="size-3.5" />
                  Send Reminder
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <InvoicePreview
        company={company}
        customer={invoice.customers ?? null}
        invoice={invoice}
        items={items}
      />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        invoiceId={invoice.id}
        documentNumber={invoice.invoice_number}
        amount={outstanding}
        onPaymentComplete={() => void invoiceQuery.refetch()}
      />

      {/* ── Record Payment modal ── */}
      <Modal
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        title="Record Payment"
      >
        <div className="space-y-4">
          {/* Balance summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Invoice total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Already received</span>
                <span>- {formatCurrency(alreadyPaid)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
              <span>Outstanding</span>
              <span>{formatCurrency(outstanding)}</span>
            </div>
          </div>

          {/* Amount input with quick-fill */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Amount received ($)
              </label>
              {outstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(outstanding.toFixed(2))}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline"
                >
                  Pay full ({formatCurrency(outstanding)})
                </button>
              )}
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={outstanding}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={outstanding.toFixed(2)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              autoFocus
            />
            {paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) < outstanding && (
              <p className="mt-1 text-xs text-amber-600">
                Partial payment — {formatCurrency(outstanding - parseFloat(paymentAmount))} will remain outstanding.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => void handleRecordPayment()}
              loading={recordPaymentMutation.isPending}
            >
              <DollarSign className="size-4" />
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
