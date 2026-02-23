import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

type DocumentType = 'quote' | 'invoice';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getStripeCredentialsForCompany = async (
  adminClient: ReturnType<typeof createClient>,
  companyId: string,
) => {
  const { data, error } = await adminClient
    .from('company_stripe_keys')
    .select('publishable_key, secret_key, is_active')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.is_active && data.publishable_key && data.secret_key) {
    return {
      publishableKey: data.publishable_key,
      secretKey: data.secret_key,
    };
  }

  const fallbackPublishable = Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '';
  const fallbackSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  if (fallbackPublishable && fallbackSecret) {
    return {
      publishableKey: fallbackPublishable,
      secretKey: fallbackSecret,
    };
  }

  throw new Error('Stripe is not configured for this company');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = await req.json() as {
      invoice_id?: string;
      booking_id?: string;
      amount?: number;
      share_token?: string;
      document_type?: DocumentType;
      currency?: string;
    };

    const invoiceId = body.invoice_id;
    const bookingId = body.booking_id;
    const shareToken = String(body.share_token ?? '').trim();
    const documentType = body.document_type;
    const currency = body.currency ?? 'aud';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required' });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Public token flow for quote/invoice links.
    if (shareToken && documentType && ['quote', 'invoice'].includes(documentType)) {
      const table = documentType === 'quote' ? 'quotes' : 'invoices';
      const numberField = documentType === 'quote' ? 'quote_number' : 'invoice_number';
      const selectFields = documentType === 'quote'
        ? 'id, company_id, total, status, share_token, quote_number'
        : 'id, company_id, total, paid_amount, status, share_token, invoice_number';
      const payableStatuses = documentType === 'quote'
        ? ['draft', 'sent', 'accepted']
        : ['draft', 'sent', 'overdue', 'partially_paid'];

      const { data: row, error } = await adminClient
        .from(table)
        .select(selectFields)
        .eq('share_token', shareToken)
        .maybeSingle();

      if (error || !row) {
        return jsonResponse(404, { error: 'Document not found' });
      }

      if (!payableStatuses.includes(row.status)) {
        return jsonResponse(400, { error: 'This document is not payable' });
      }

      // For invoices, charge only the outstanding balance (total minus any prior payments).
      const paidSoFar = documentType === 'invoice'
        ? Number((row as Record<string, unknown>).paid_amount ?? 0)
        : 0;
      const outstandingAmount = Math.max(Number(row.total ?? 0) - paidSoFar, 0);
      const amountCents = Math.round(outstandingAmount * 100);
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        return jsonResponse(400, { error: 'No outstanding balance on this document' });
      }

      const stripeConfig = await getStripeCredentialsForCompany(adminClient, row.company_id);
      const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2024-06-20' });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency,
        metadata: {
          document_type: documentType,
          company_id: row.company_id,
          share_token: shareToken,
          invoice_id: documentType === 'invoice' ? row.id : '',
          quote_id: documentType === 'quote' ? row.id : '',
        },
        description: `Payment for ${documentType} ${String(row[numberField as keyof typeof row] ?? '')}`,
        automatic_payment_methods: { enabled: true },
      });

      return jsonResponse(200, {
        clientSecret: paymentIntent.client_secret,
        publishableKey: stripeConfig.publishableKey,
      });
    }

    // Authenticated flows require an auth header.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // ── Booking payment flow (deposit / upfront) ──
    if (bookingId) {
      const { data: booking, error: bookingError } = await userClient
        .from('bookings')
        .select('id, company_id, booking_number, payment_plan, deposit_amount, deposit_paid_amount, total_amount, paid_in_full_date, status')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        return jsonResponse(404, { error: 'Booking not found' });
      }

      if (booking.paid_in_full_date) {
        return jsonResponse(400, { error: 'This job is already fully paid' });
      }

      let chargeAmount: number;
      if (typeof body.amount === 'number' && body.amount > 0) {
        chargeAmount = body.amount;
      } else if (booking.payment_plan === 'deposit') {
        chargeAmount = Math.max(Number(booking.deposit_amount ?? 0) - Number(booking.deposit_paid_amount ?? 0), 0);
      } else {
        chargeAmount = Number(booking.total_amount ?? 0);
      }

      const amountCents = Math.round(chargeAmount * 100);
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        return jsonResponse(400, { error: 'No outstanding balance on this booking' });
      }

      const stripeConfig = await getStripeCredentialsForCompany(adminClient, booking.company_id);
      const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2024-06-20' });

      const label = booking.booking_number ?? `Job #${booking.id.slice(0, 8)}`;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency,
        metadata: {
          document_type: 'booking',
          company_id: booking.company_id,
          booking_id: booking.id,
          payment_plan: booking.payment_plan ?? '',
        },
        description: `Payment for ${label}`,
        automatic_payment_methods: { enabled: true },
      });

      return jsonResponse(200, {
        clientSecret: paymentIntent.client_secret,
        publishableKey: stripeConfig.publishableKey,
      });
    }

    // ── Authenticated internal invoice flow ──
    if (!invoiceId) {
      return jsonResponse(400, { error: 'invoice_id or booking_id is required' });
    }

    const { data: invoice, error: invoiceError } = await userClient
      .from('invoices')
      .select('id, company_id, total, paid_amount, status, invoice_number')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return jsonResponse(404, { error: 'Invoice not found' });
    }

    if (['paid', 'cancelled'].includes(invoice.status)) {
      return jsonResponse(400, { error: 'Invoice is not payable' });
    }

    const outstandingAmount = Math.max(Number(invoice.total ?? 0) - Number(invoice.paid_amount ?? 0), 0);
    const chargeAmount = (typeof body.amount === 'number' && body.amount > 0)
      ? Math.min(body.amount, outstandingAmount)
      : outstandingAmount;
    const amountCents = Math.round(chargeAmount * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return jsonResponse(400, { error: 'No outstanding balance on this invoice' });
    }

    const stripeConfig = await getStripeCredentialsForCompany(adminClient, invoice.company_id);
    const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2024-06-20' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        document_type: 'invoice',
        company_id: invoice.company_id,
        invoice_id: invoice.id,
      },
      description: `Payment for invoice ${invoice.invoice_number}`,
      automatic_payment_methods: { enabled: true },
    });

    return jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
      publishableKey: stripeConfig.publishableKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const isConfigError = message.toLowerCase().includes('not configured');
    return jsonResponse(isConfigError ? 400 : 500, { error: message });
  }
});
