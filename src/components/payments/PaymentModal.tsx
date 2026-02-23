import { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Lock, CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { DocumentType } from '../../types';

const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

const getStripePromise = (publishableKey: string) => {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey)!;
};

interface PaymentFormProps {
  amount: number;
  documentLabel: string;
  onSuccess: () => void;
}

function PaymentForm({ amount, documentLabel, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setErrorMsg(submitErr.message ?? 'Payment failed');
        setSubmitting(false);
        return;
      }

      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (confirmErr) {
        setErrorMsg(confirmErr.message ?? 'Payment failed');
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        setErrorMsg('Payment is still processing. Please wait a moment and refresh.');
        setSubmitting(false);
        return;
      }

      toast.success(`Payment received for ${documentLabel}.`);
      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Amount due</p>
        <p className="mt-1 text-3xl font-bold text-blue-900">{formatCurrency(amount)}</p>
        <p className="mt-0.5 text-xs text-blue-500">{documentLabel} - AUD</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Payment details</label>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { email: 'auto' } },
          }}
        />
      </div>

      {errorMsg ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Lock className="size-3.5" />
        <span>Payments are secured and encrypted by Stripe. We never store your card details.</span>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={submitting}
        disabled={!stripe || !elements || submitting}
      >
        <CreditCard className="size-4" />
        Pay {formatCurrency(amount)}
      </Button>
    </form>
  );
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId?: string;
  bookingId?: string;
  shareToken?: string;
  documentType?: DocumentType | 'booking';
  documentNumber: string;
  amount: number;
  publishableKey?: string | null;
  onPaymentComplete: () => void;
}

export function PaymentModal({
  open,
  onClose,
  invoiceId,
  bookingId,
  shareToken,
  documentType = 'invoice',
  documentNumber,
  amount,
  publishableKey,
  onPaymentComplete,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [resolvedPublishableKey, setResolvedPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setFetchError(null);
    setClientSecret(null);
    setResolvedPublishableKey(null);

    const fetchPaymentIntent = async () => {
      try {
        const body = shareToken
          ? { document_type: documentType, share_token: shareToken, currency: 'aud' }
          : bookingId
            ? { booking_id: bookingId, amount, currency: 'aud' }
            : { invoice_id: invoiceId, amount, currency: 'aud' };

        const headers: Record<string, string> = {};
        if (!shareToken) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        }

        const res = await supabase.functions.invoke('create-payment-intent', {
          body,
          headers,
        });

        if (res.error) {
          let message = res.error.message;
          const ctx = (res.error as unknown as { context?: Response })?.context;
          if (ctx && typeof ctx.json === 'function') {
            try {
              const errBody = await ctx.json();
              if (typeof errBody?.error === 'string') message = errBody.error;
              else if (typeof errBody?.message === 'string') message = errBody.message;
            } catch { /* response already consumed */ }
          }
          throw new Error(message);
        }

        const {
          clientSecret: cs,
          publishableKey: keyFromFunction,
        } = res.data as { clientSecret: string; publishableKey?: string | null };

        const effectiveKey = keyFromFunction ?? publishableKey ?? null;
        if (!effectiveKey) {
          throw new Error('Stripe is not configured for this company');
        }

        setClientSecret(cs);
        setResolvedPublishableKey(effectiveKey);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to initialise payment');
      } finally {
        setLoading(false);
      }
    };

    void fetchPaymentIntent();
  }, [open, invoiceId, bookingId, amount, shareToken, documentType, publishableKey]);

  const handleSuccess = () => {
    onPaymentComplete();
    onClose();
  };

  const typeLabel = documentType === 'quote' ? 'Quote' : documentType === 'booking' ? 'Job' : 'Invoice';
  const label = `${typeLabel} ${documentNumber}`;
  const stripePromise = resolvedPublishableKey ? getStripePromise(resolvedPublishableKey) : null;

  return (
    <Modal open={open} onClose={onClose} title="Secure Payment" size="sm" description={label}>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Preparing secure payment...</p>
        </div>
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Could not load payment</p>
          <p className="mt-1 text-xs">{fetchError}</p>
          {fetchError.toLowerCase().includes('not configured') ? (
            <p className="mt-2 text-xs text-red-600">
              The business owner needs to connect their Stripe account in Settings before online payments can be accepted.
            </p>
          ) : null}
        </div>
      ) : clientSecret && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#2563eb',
                borderRadius: '10px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
            },
          }}
        >
          <PaymentForm
            amount={amount}
            documentLabel={label}
            onSuccess={handleSuccess}
          />
        </Elements>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Stripe is not configured</p>
          <p className="mt-1 text-xs">
            Ask your company admin to add Stripe keys in Settings under Invoice Settings.
          </p>
        </div>
      )}
    </Modal>
  );
}
