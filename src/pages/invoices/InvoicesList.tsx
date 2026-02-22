import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Link2, Mail, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useInvoices } from '../../hooks/useInvoices';
import { useCustomers } from '../../hooks/useCustomers';
import { useBookings } from '../../hooks/useBookings';
import { createDocumentShareLink, generateDocumentNumber, sendDocumentEmail } from '../../services/api';
import { InvoiceForm } from '../../components/invoices/InvoiceForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableContainer } from '../../components/ui/Table';
import { dueDateStatus, formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice, InvoiceItem, InvoiceStatus } from '../../types';

const statuses = ['', 'draft', 'sent', 'partially_paid', 'paid', 'overdue'];

export default function InvoicesList() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [search, setSearch] = useState('');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [copyingInvoiceId, setCopyingInvoiceId] = useState<string | null>(null);

  const { invoicesQuery, saveInvoiceMutation } = useInvoices(status || undefined);
  const { customersQuery } = useCustomers();
  const { bookingsQuery } = useBookings();

  const invoices = useMemo(() => {
    const sorted = [...(invoicesQuery.data ?? [])].sort((a, b) => b.issue_date.localeCompare(a.issue_date));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (inv) =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.customers?.name?.toLowerCase().includes(q),
    );
  }, [invoicesQuery.data, search]);

  // Auto-open create modal when ?new=true (e.g. from Dashboard CTA)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      void handleCreateOpen();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOpen = async () => {
    try {
      const number = await generateDocumentNumber('INV');
      setInvoiceNumber(number);
      setOpen(true);
    } catch {
      setInvoiceNumber('INV-HB-0001');
      setOpen(true);
    }
  };

  const onSubmit = async (
    payload: Partial<Invoice>,
    items: Array<Pick<InvoiceItem, 'description' | 'quantity' | 'unit_price'>>,
  ) => {
    if (!profile?.company_id) {
      return;
    }

    if (!payload.invoice_number || !payload.customer_id || !payload.due_date) {
      toast.error('Invoice number, customer, and due date are required');
      return;
    }

    try {
      const invoicePayload: Partial<Invoice> = {
        ...payload,
        company_id: profile.company_id,
        booking_id: payload.booking_id ?? null,
        subtotal: payload.subtotal ?? 0,
        gst: payload.gst ?? 0,
        total: payload.total ?? 0,
        status: (payload.status ?? 'draft') as InvoiceStatus,
        issue_date: payload.issue_date ?? new Date().toISOString().split('T')[0],
      };
      await saveInvoiceMutation.mutateAsync({
        payload: invoicePayload,
        items,
      });
      toast.success('Invoice saved');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save invoice');
    }
  };

  const handleSendInvoice = async (invoiceId: string, email?: string | null) => {
    setSendingInvoiceId(invoiceId);
    try {
      const response = await sendDocumentEmail('invoice', invoiceId, email ?? undefined);
      if (response.email_sent) {
        toast.success(response.to_email ? `Invoice emailed to ${response.to_email}` : 'Invoice email sent');
      } else {
        toast.info('Email service unavailable right now. A private invoice link was generated instead.');
      }
      void invoicesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice email');
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const handleCopyInvoiceLink = async (invoiceId: string) => {
    setCopyingInvoiceId(invoiceId);
    try {
      const response = await createDocumentShareLink('invoice', invoiceId);
      if (!navigator?.clipboard) {
        throw new Error('Clipboard is not available in this browser');
      }
      await navigator.clipboard.writeText(response.share_url);
      toast.success('Private invoice link copied');
      void invoicesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy invoice link');
    } finally {
      setCopyingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Invoices</h2>
        <Button onClick={() => void handleCreateOpen()}>
          <Plus className="size-4" />
          Create Invoice
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {statuses.map((tab) => (
          <Button key={tab || 'all'} size="sm" variant={status === tab ? 'primary' : 'secondary'} onClick={() => setStatus(tab)}>
            {tab ? tab.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </Button>
        ))}
        <div className="relative ml-auto min-w-48">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
      </div>

      <TableContainer>
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Outstanding</th>
              <th className="p-3">Status</th>
              <th className="p-3">Issue</th>
              <th className="p-3">Due</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoicesQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="p-3" colSpan={8}>
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </td>
                </tr>
              ))
            ) : invoicesQuery.isError ? (
              <tr className="border-t border-slate-100">
                <td colSpan={8} className="p-6 text-sm text-red-600">
                  {invoicesQuery.error instanceof Error
                    ? invoicesQuery.error.message
                    : 'Invoices failed to load'}
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={8} className="p-6 text-sm text-slate-500">No invoices found for this filter.</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-blue-600"><Link to={`/invoices/${invoice.id}`}>{invoice.invoice_number}</Link></td>
                  <td className="p-3">{invoice.customers?.name}</td>
                  <td className="p-3">{formatCurrency(invoice.total)}</td>
                  <td className="p-3">
                    {(() => {
                      const outstanding = Math.max(invoice.total - Number(invoice.paid_amount ?? 0), 0);
                      return outstanding > 0 ? (
                        <span className="font-semibold text-red-600">{formatCurrency(outstanding)}</span>
                      ) : (
                        <span className="text-emerald-600">—</span>
                      );
                    })()}
                  </td>
                  <td className="p-3"><StatusBadge status={invoice.status} /></td>
                  <td className="p-3">{formatDate(invoice.issue_date)}</td>
                  <td className="p-3">
                    <span>{formatDate(invoice.due_date)}</span>
                    {(() => {
                      const dd = dueDateStatus(invoice.due_date, invoice.status === 'paid' || invoice.status === 'cancelled');
                      if (!dd) return null;
                      const cls = {
                        emerald: 'text-emerald-600',
                        amber:   'text-amber-600',
                        red:     'font-semibold text-red-600',
                        slate:   'text-slate-400',
                      }[dd.color];
                      return <span className={`ml-1.5 text-xs ${cls}`}>{dd.label}</span>;
                    })()}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleSendInvoice(invoice.id, invoice.customers?.email)}
                        loading={sendingInvoiceId === invoice.id}
                      >
                        <Mail className="size-3.5" />
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleCopyInvoiceLink(invoice.id)}
                        loading={copyingInvoiceId === invoice.id}
                      >
                        <Link2 className="size-3.5" />
                        Link
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Invoice">
        <InvoiceForm
          customers={customersQuery.data ?? []}
          bookings={bookingsQuery.data ?? []}
          defaultValues={{ invoice_number: invoiceNumber }}
          onSubmit={onSubmit}
          loading={saveInvoiceMutation.isPending}
        />
      </Modal>
    </div>
  );
}
