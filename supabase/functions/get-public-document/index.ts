import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

type DocumentType = 'quote' | 'invoice' | 'booking';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getStripePublicConfig = async (
  adminClient: ReturnType<typeof createClient>,
  companyId: string,
) => {
  try {
    const { data, error } = await adminClient
      .from('company_stripe_keys')
      .select('publishable_key, secret_key, is_active')
      .eq('company_id', companyId)
      .maybeSingle();

    if (!error && data?.is_active && data.publishable_key && data.secret_key) {
      return {
        publishableKey: data.publishable_key,
        configured: true,
      };
    }
  } catch {
    // Table may not exist yet
  }

  const fallbackPublishable = Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '';
  const fallbackSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  if (fallbackPublishable && fallbackSecret) {
    return {
      publishableKey: fallbackPublishable,
      configured: true,
    };
  }

  return {
    publishableKey: null,
    configured: false,
  };
};

const getAppBaseUrl = () => {
  const configured = (Deno.env.get('APP_BASE_URL') ?? '').trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return 'http://localhost:5173';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = await req.json() as { document_type?: DocumentType; token?: string };
    const documentType = body.document_type;
    const token = String(body.token ?? '').trim();

    if (!documentType || !['quote', 'invoice', 'booking'].includes(documentType)) {
      return jsonResponse(400, { error: 'document_type must be quote, invoice, or booking' });
    }
    if (!token) {
      return jsonResponse(400, { error: 'token is required' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' });
    }
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (documentType === 'booking') {
      const { data: booking, error: bookingError } = await adminClient
        .from('bookings')
        .select('*')
        .eq('share_token', token)
        .maybeSingle();

      if (bookingError || !booking) {
        return jsonResponse(404, { error: 'Document not found' });
      }

      const [companyRes, customerRes, settingsRes] = await Promise.all([
        adminClient.from('companies').select('*').eq('id', booking.company_id).maybeSingle(),
        adminClient.from('customers').select('*').eq('id', booking.customer_id).maybeSingle(),
        adminClient.from('company_settings').select('bank_name, bank_bsb, bank_account_number, bank_account_name').eq('company_id', booking.company_id).maybeSingle(),
      ]);

      if (companyRes.error || customerRes.error) {
        return jsonResponse(500, {
          error: companyRes.error?.message ?? customerRes.error?.message,
        });
      }

      const stripeConfig = await getStripePublicConfig(adminClient, booking.company_id);
      const totalAmount = Number(booking.total_amount ?? 0);
      const depositDue = Number(booking.deposit_amount ?? 0);
      const depositPaid = Number(booking.deposit_paid_amount ?? 0);
      const isDeposit = booking.payment_plan === 'deposit';
      const outstanding = isDeposit
        ? Math.max(depositDue - depositPaid, 0)
        : Math.max(totalAmount, 0);
      const canPayOnline =
        stripeConfig.configured &&
        outstanding > 0 &&
        !booking.paid_in_full_date &&
        ['quote', 'confirmed'].includes(booking.status);
      const shareUrl = `${getAppBaseUrl()}/public/booking/${token}`;

      return jsonResponse(200, {
        document_type: 'booking',
        share_url: shareUrl,
        payment_url: canPayOnline ? `${shareUrl}?pay=1` : null,
        can_pay_online: canPayOnline,
        stripe_publishable_key: stripeConfig.publishableKey,
        company: companyRes.data,
        customer: customerRes.data,
        document: booking,
        items: [],
        bank_details: settingsRes?.data ?? null,
      });
    }

    if (documentType === 'invoice') {
      const { data: invoice, error: invoiceError } = await adminClient
        .from('invoices')
        .select('*')
        .eq('share_token', token)
        .maybeSingle();

      if (invoiceError || !invoice) {
        return jsonResponse(404, { error: 'Document not found' });
      }

      const [companyRes, customerRes, itemsRes, settingsRes] = await Promise.all([
        adminClient.from('companies').select('*').eq('id', invoice.company_id).maybeSingle(),
        adminClient.from('customers').select('*').eq('id', invoice.customer_id).maybeSingle(),
        adminClient.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('created_at', { ascending: true }),
        adminClient.from('company_settings').select('bank_name, bank_bsb, bank_account_number, bank_account_name').eq('company_id', invoice.company_id).maybeSingle(),
      ]);

      if (companyRes.error || customerRes.error || itemsRes.error) {
        return jsonResponse(500, {
          error: companyRes.error?.message ?? customerRes.error?.message ?? itemsRes.error?.message,
        });
      }

      const stripeConfig = await getStripePublicConfig(adminClient, invoice.company_id);
      const invoiceOutstanding = Math.max(Number(invoice.total ?? 0) - Number(invoice.paid_amount ?? 0), 0);
      const canPayOnline =
        stripeConfig.configured &&
        invoiceOutstanding > 0 &&
        ['draft', 'sent', 'overdue', 'partially_paid'].includes(invoice.status);
      const shareUrl = `${getAppBaseUrl()}/public/invoice/${token}`;

      return jsonResponse(200, {
        document_type: 'invoice',
        share_url: shareUrl,
        payment_url: canPayOnline ? `${shareUrl}?pay=1` : null,
        can_pay_online: canPayOnline,
        stripe_publishable_key: stripeConfig.publishableKey,
        company: companyRes.data,
        customer: customerRes.data,
        document: invoice,
        items: itemsRes.data ?? [],
        bank_details: settingsRes?.data ?? null,
      });
    }

    const { data: quote, error: quoteError } = await adminClient
      .from('quotes')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();

    if (quoteError || !quote) {
      return jsonResponse(404, { error: 'Document not found' });
    }

    const [companyRes, customerRes, itemsRes, settingsRes] = await Promise.all([
      adminClient.from('companies').select('*').eq('id', quote.company_id).maybeSingle(),
      adminClient.from('customers').select('*').eq('id', quote.customer_id).maybeSingle(),
      adminClient.from('quote_items').select('*').eq('quote_id', quote.id).order('created_at', { ascending: true }),
      adminClient.from('company_settings').select('bank_name, bank_bsb, bank_account_number, bank_account_name').eq('company_id', quote.company_id).maybeSingle(),
    ]);

    if (companyRes.error || customerRes.error || itemsRes.error) {
      return jsonResponse(500, {
        error: companyRes.error?.message ?? customerRes.error?.message ?? itemsRes.error?.message,
      });
    }

    const stripeConfig = await getStripePublicConfig(adminClient, quote.company_id);
    const canPayOnline =
      stripeConfig.configured &&
      Number(quote.total ?? 0) > 0 &&
      ['draft', 'sent', 'accepted'].includes(quote.status);
    const shareUrl = `${getAppBaseUrl()}/public/quote/${token}`;

    return jsonResponse(200, {
      document_type: 'quote',
      share_url: shareUrl,
      payment_url: canPayOnline ? `${shareUrl}?pay=1` : null,
      can_pay_online: canPayOnline,
      stripe_publishable_key: stripeConfig.publishableKey,
      company: companyRes.data,
      customer: customerRes.data,
      document: quote,
      items: itemsRes.data ?? [],
      bank_details: settingsRes?.data ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
