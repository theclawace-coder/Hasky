import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const getAppBaseUrl = () => {
  const configured = (Deno.env.get('APP_BASE_URL') ?? '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:5173';
};

const slugifyCompanyName = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

const buildFromAddress = (companyName: string): string => {
  const domain = (Deno.env.get('RESEND_FROM_DOMAIN') ?? '').trim();
  const fallback = (Deno.env.get('RESEND_FROM_EMAIL') ?? '').trim();
  if (!domain) return fallback;
  const slug = slugifyCompanyName(companyName);
  const local = slug ? `notifications.${slug}` : 'notifications';
  return `${companyName} via Hasky <${local}@${domain}>`;
};

const formatAud = (amount: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

const formatAuDate = (iso: string) =>
  new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));

const paymentMethodLabel = (method: string): string => {
  const map: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    cheque: 'Cheque',
    stripe: 'Online (Stripe)',
    other: 'Other',
  };
  return map[method] ?? method;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse(401, { error: 'Unauthorized' });

    const body = await req.json() as { payment_id?: string };
    const paymentId = body.payment_id;
    if (!paymentId) return jsonResponse(400, { error: 'payment_id is required' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Fetch the specific payment record.
    const { data: payment, error: paymentError } = await userClient
      .from('invoice_payments')
      .select('id, invoice_id, company_id, amount, payment_method, payment_date, notes')
      .eq('id', paymentId)
      .maybeSingle();

    if (paymentError || !payment) {
      return jsonResponse(404, { error: 'Payment not found or access denied' });
    }

    // Fetch the parent invoice with related data.
    const { data: invoice, error: invoiceError } = await userClient
      .from('invoices')
      .select(`
        id, invoice_number, total, paid_amount, status, share_token, due_date,
        customers(name, email),
        companies(name, email)
      `)
      .eq('id', payment.invoice_id)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return jsonResponse(404, { error: 'Invoice not found or access denied' });
    }

    // Fetch all payments for this invoice to show full history in receipt.
    const { data: allPayments } = await userClient
      .from('invoice_payments')
      .select('id, amount, payment_method, payment_date, notes')
      .eq('invoice_id', payment.invoice_id)
      .order('created_at', { ascending: true });

    const payments = allPayments ?? [];

    const customer = normalizeRelation<{ name?: string; email?: string }>(
      invoice.customers as { name?: string; email?: string } | { name?: string; email?: string }[] | null,
    );
    const company = normalizeRelation<{ name?: string; email?: string }>(
      invoice.companies as { name?: string; email?: string } | { name?: string; email?: string }[] | null,
    );

    const toEmail = customer?.email ?? null;
    if (!toEmail) {
      return jsonResponse(400, { error: 'No email address found for this customer — update the customer record first' });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const resendDomain = (Deno.env.get('RESEND_FROM_DOMAIN') ?? '').trim();
    const resendFromEmail = (Deno.env.get('RESEND_FROM_EMAIL') ?? '').trim();
    if (!resendApiKey || (!resendDomain && !resendFromEmail)) {
      return jsonResponse(500, { error: 'RESEND_API_KEY and either RESEND_FROM_DOMAIN or RESEND_FROM_EMAIL must be set via Supabase secrets' });
    }

    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Ensure the invoice has a share token so we can generate a view link.
    let shareToken = invoice.share_token as string | null;
    if (!shareToken) {
      shareToken = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;
      await adminClient
        .from('invoices')
        .update({ share_token: shareToken })
        .eq('id', invoice.id);
    }

    const appBaseUrl = getAppBaseUrl();
    const shareUrl = `${appBaseUrl}/public/invoice/${shareToken}`;

    const companyName = company?.name ?? 'Your supplier';
    const companyEmail = company?.email ?? null;
    const customerName = customer?.name ?? 'there';

    const totalAmount = Number(invoice.total ?? 0);
    const paidAmount = Number(invoice.paid_amount ?? 0);
    const outstanding = Math.max(totalAmount - paidAmount, 0);
    const isPaidInFull = outstanding <= 0;

    const thisPaymentAmount = Number(payment.amount ?? 0);

    // Build payment history rows.
    const historyRows = payments.map((p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${formatAuDate(String(p.payment_date))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${paymentMethodLabel(p.payment_method)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatAud(Number(p.amount))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${p.notes ?? '—'}</td>
      </tr>
    `).join('');

    const paidInFullBanner = isPaidInFull
      ? `<div style="margin:20px 0;padding:14px 18px;background:#d1fae5;border:1px solid #6ee7b7;border-radius:10px;color:#065f46;font-weight:700;font-size:15px;text-align:center;">
           PAID IN FULL — Thank you!
         </div>`
      : `<p style="margin:16px 0;color:#64748b;font-size:14px;">
           <strong>Outstanding balance:</strong> ${formatAud(outstanding)}
           &nbsp;&nbsp;<a href="${shareUrl}?pay=1" style="color:#2563eb;">Pay remaining online</a>
         </p>`;

    const viewBtn = `<a href="${shareUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;">View Invoice</a>`;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:600px;">
        <h2 style="margin:0 0 4px;font-size:22px;color:#0f172a;">Payment Receipt</h2>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;">${companyName}</p>

        <p>Hi ${customerName},</p>
        <p>Thank you — we've received your payment of <strong>${formatAud(thisPaymentAmount)}</strong> for invoice <strong>${invoice.invoice_number}</strong>.</p>

        <table style="border-collapse:collapse;width:100%;margin:8px 0 20px;background:#f8fafc;border-radius:8px;overflow:hidden;font-size:14px;">
          <tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;"><strong>Invoice</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${invoice.invoice_number}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;"><strong>Invoice total</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${formatAud(totalAmount)}</td></tr>
          <tr style="background:#f0fdf4;"><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;"><strong>This payment</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#059669;font-weight:700;">${formatAud(thisPaymentAmount)} (${paymentMethodLabel(payment.payment_method)})</td></tr>
          <tr><td style="padding:10px 12px;"><strong>Total paid</strong></td><td style="padding:10px 12px;color:#059669;">${formatAud(paidAmount)}</td></tr>
        </table>

        ${payments.length > 1 ? `
        <h3 style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#374151;">Payment History</h3>
        <table style="border-collapse:collapse;width:100%;font-size:14px;background:#f8fafc;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#e2e8f0;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;">Date</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;">Method</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;">Amount</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;">Notes</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>` : ''}

        ${paidInFullBanner}

        <p style="margin:20px 0;">${viewBtn}</p>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">${companyName}${companyEmail ? ` &middot; ${companyEmail}` : ''}</p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: buildFromAddress(companyName),
        to: [toEmail],
        reply_to: companyEmail ? [companyEmail] : undefined,
        subject: `Payment Receipt: ${invoice.invoice_number} — ${formatAud(thisPaymentAmount)} received — ${companyName}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return jsonResponse(502, { error: `Email delivery failed: ${errorText}` });
    }

    return jsonResponse(200, {
      payment_id: paymentId,
      to_email: toEmail,
      email_sent: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
