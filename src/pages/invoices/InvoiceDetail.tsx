import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Printer, Send, CheckCircle, ArrowLeft, Mail, Link2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useInvoice, useInvoices } from '../../hooks/useInvoices';
import { createDocumentShareLink, sendDocumentEmail } from '../../services/api';
import { InvoicePreview } from '../../components/invoices/InvoicePreview';
import { PaymentModal } from '../../components/payments/PaymentModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import type { InvoiceItem } from '../../types';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { company } = useAuth();
  const { updateStatusMutation } = useInvoices();
  const invoiceQuery = useInvoice(id ?? '');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);

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

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await sendDocumentEmail('invoice', invoice.id, invoice.customers?.email ?? undefined);
      toast.success(response.to_email ? `Invoice emailed to ${response.to_email}` : 'Invoice email sent');
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

  const canPayOnline = invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <div className="space-y-4">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/invoices"
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{invoice.invoice_number}</h2>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {invoice.customers?.name} - {formatCurrency(invoice.total)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {invoice.status === 'draft' ? (
              <Button
                variant="secondary"
                onClick={() => void handleStatus('sent')}
                loading={updateStatusMutation.isPending}
              >
                <Send className="size-4" />
                Mark as Sent
              </Button>
            ) : null}

            {invoice.status === 'sent' ? (
              <Button
                variant="success"
                onClick={() => void handleStatus('paid')}
                loading={updateStatusMutation.isPending}
              >
                <CheckCircle className="size-4" />
                Mark Paid
              </Button>
            ) : null}

            {canPayOnline ? (
              <Button onClick={() => setPaymentOpen(true)}>
                <CreditCard className="size-4" />
                Pay Now - {formatCurrency(invoice.total)}
              </Button>
            ) : null}

            <Button
              variant="secondary"
              onClick={() => void handleSendEmail()}
              loading={sendingEmail}
            >
              <Mail className="size-4" />
              Send Email
            </Button>

            <Button
              variant="secondary"
              onClick={() => void handleCopyLink()}
              loading={copyingLink}
            >
              <Link2 className="size-4" />
              Copy Link
            </Button>

            {invoice.status === 'paid' ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle className="size-4" />
                Paid
              </div>
            ) : null}

            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print / PDF
            </Button>
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
        amount={invoice.total}
        onPaymentComplete={() => void invoiceQuery.refetch()}
      />
    </div>
  );
}
