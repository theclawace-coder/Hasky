import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PaymentModal } from '../../components/payments/PaymentModal';
import { InvoicePreview } from '../../components/invoices/InvoicePreview';
import { QuotePreview } from '../../components/quotes/QuotePreview';
import { getPublicDocument } from '../../services/api';
import { formatCurrency } from '../../lib/utils';
import type { DocumentType, Invoice, InvoiceItem, Quote, QuoteItem } from '../../types';

function isDocumentType(value: string | undefined): value is DocumentType {
  return value === 'invoice' || value === 'quote';
}

export default function PublicDocumentPage() {
  const { documentType: rawDocumentType, token } = useParams<{
    documentType: string;
    token: string;
  }>();
  const [searchParams] = useSearchParams();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const documentType = isDocumentType(rawDocumentType) ? rawDocumentType : null;

  const documentQuery = useQuery({
    queryKey: ['public_document', documentType, token],
    queryFn: () => getPublicDocument(documentType as DocumentType, token as string),
    enabled: Boolean(documentType && token),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!documentQuery.data || searchParams.get('pay') !== '1') return;
    if (documentQuery.data.can_pay_online) {
      setPaymentOpen(true);
    }
  }, [documentQuery.data, searchParams]);

  const payload = documentQuery.data;
  const document = payload?.document as Invoice | Quote | undefined;
  const items = payload?.items as Array<InvoiceItem | QuoteItem> | undefined;

  const summary = useMemo(() => {
    if (!document || !documentType) {
      return null;
    }

    const number = documentType === 'invoice'
      ? (document as Invoice).invoice_number
      : (document as Quote).quote_number;

    return {
      label: documentType === 'invoice' ? 'Invoice' : 'Quote',
      number,
      total: Number(document.total ?? 0),
      status: document.status,
    };
  }, [document, documentType]);

  if (!documentType || !token) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <Card>
          <p className="text-sm text-slate-600">Invalid document link.</p>
        </Card>
      </div>
    );
  }

  if (documentQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (documentQuery.isError || !payload || !document || !items || !summary) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <Card>
          <p className="text-sm text-slate-600">This private link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{summary.label} {summary.number}</h2>
              <StatusBadge status={summary.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {payload.customer?.name ?? 'Customer'} - {formatCurrency(summary.total)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {payload.can_pay_online ? (
              <Button onClick={() => setPaymentOpen(true)}>
                <CreditCard className="size-4" />
                Pay Now
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => window.print()}>
              <Download className="size-4" />
              Download / Print
            </Button>
          </div>
        </div>
      </Card>

      {documentType === 'invoice' ? (
        <InvoicePreview
          company={payload.company}
          customer={payload.customer}
          invoice={document as Invoice}
          items={items as InvoiceItem[]}
        />
      ) : (
        <QuotePreview
          company={payload.company}
          customer={payload.customer}
          quote={document as Quote}
          items={items as QuoteItem[]}
        />
      )}

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        shareToken={token}
        documentType={documentType}
        documentNumber={summary.number}
        amount={summary.total}
        publishableKey={payload.stripe_publishable_key}
        onPaymentComplete={() => void documentQuery.refetch()}
      />
    </div>
  );
}
