import { useMemo, useState } from 'react';
import { Link2, Mail, Plus } from 'lucide-react';
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
import { formatCurrency, formatDate } from '../../lib/utils';

const statuses = ['', 'draft', 'sent', 'paid', 'overdue'];

export default function InvoicesList() {
  const { profile } = useAuth();
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [copyingInvoiceId, setCopyingInvoiceId] = useState<string | null>(null);

  const { invoicesQuery, saveInvoiceMutation } = useInvoices(status || undefined);
  const { customersQuery } = useCustomers();
  const { bookingsQuery } = useBookings();

  const invoices = useMemo(
    () => [...(invoicesQuery.data ?? [])].sort((a, b) => b.issue_date.localeCompare(a.issue_date)),
    [invoicesQuery.data],
  );

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

  const onSubmit = async (payload: any, items: Array<{ description: string; quantity: number; unit_price: number }>) => {
    if (!profile?.company_id) {
      return;
    }

    if (!payload.invoice_number || !payload.customer_id || !payload.due_date) {
      toast.error('Invoice number, customer, and due date are required');
      return;
    }

    try {
      await saveInvoiceMutation.mutateAsync({
        payload: {
          ...payload,
          company_id: profile.company_id,
          booking_id: payload.booking_id ?? null,
          subtotal: payload.subtotal ?? 0,
          gst: payload.gst ?? 0,
          total: payload.total ?? 0,
          status: (payload.status ?? 'draft') as any,
          issue_date: payload.issue_date ?? new Date().toISOString().split('T')[0],
        } as any,
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
      toast.success(response.to_email ? `Invoice emailed to ${response.to_email}` : 'Invoice email sent');
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

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {statuses.map((tab) => (
          <Button key={tab || 'all'} size="sm" variant={status === tab ? 'primary' : 'secondary'} onClick={() => setStatus(tab)}>
            {tab ? tab[0].toUpperCase() + tab.slice(1) : 'All'}
          </Button>
        ))}
      </div>

      <TableContainer>
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
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
                  <td className="p-3" colSpan={7}>
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </td>
                </tr>
              ))
            ) : invoicesQuery.isError ? (
              <tr className="border-t border-slate-100">
                <td colSpan={7} className="p-6 text-sm text-red-600">
                  {invoicesQuery.error instanceof Error
                    ? invoicesQuery.error.message
                    : 'Invoices failed to load'}
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={7} className="p-6 text-sm text-slate-500">No invoices found for this filter.</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-blue-600"><a href={`/invoices/${invoice.id}`}>{invoice.invoice_number}</a></td>
                  <td className="p-3">{invoice.customers?.name}</td>
                  <td className="p-3">{formatCurrency(invoice.total)}</td>
                  <td className="p-3"><StatusBadge status={invoice.status} /></td>
                  <td className="p-3">{formatDate(invoice.issue_date)}</td>
                  <td className="p-3">{formatDate(invoice.due_date)}</td>
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
