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

    const body = await req.json() as { invoice_id?: string };
    const invoiceId = body.invoice_id;
    if (!invoiceId) return jsonResponse(400, { error: 'invoice_id is required' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: invoice, error: invoiceError } = await userClient
      .from('invoices')
      .select(`
        id, company_id, invoice_number, status, total, paid_amount, due_date, share_token,
        customers(name, email),
        companies(name, email)
      `)
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return jsonResponse(404, { error: 'Invoice not found or access denied' });
    }

    if (['paid', 'cancelled'].includes(String(invoice.status))) {
      return jsonResponse(400, { error: 'This invoice is already paid or cancelled' });
    }

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

    let shareToken = invoice.share_token as string | null;
    if (!shareToken) {
      shareToken = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;
      await adminClient
        .from('invoices')
        .update({ share_token: shareToken })
        .eq('id', invoiceId);
    }

    const appBaseUrl = getAppBaseUrl();
    const shareUrl = `${appBaseUrl}/public/invoice/${shareToken}`;
    const paymentUrl = `${shareUrl}?pay=1`;

    const companyName = company?.name ?? 'Hasky';
    const companyEmail = company?.email ?? null;
    const customerName = customer?.name ?? 'there';
    const isOverdue = invoice.status === 'overdue';
    const totalAmount = Number(invoice.total ?? 0);
    const paidAmount = Number(invoice.paid_amount ?? 0);
    const outstanding = Math.max(totalAmount - paidAmount, 0);
    const amount = formatAud(outstanding);
    const dueDateStr = invoice.due_date ? formatAuDate(String(invoice.due_date)) : null;

    const viewBtn = shareUrl
      ? `<a href="${shareUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;margin-right:8px;">View Invoice</a>`
      : '';

    const payBtn = paymentUrl
      ? `<a href="${paymentUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#059669;color:#fff;text-decoration:none;font-weight:600;">Pay Online</a>`
      : '';

    const partialRow = paidAmount > 0
      ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong>Paid so far</strong></td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#059669;">${formatAud(paidAmount)}</td></tr>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:580px;">
        <p>Hi ${customerName},</p>
        <p>
          ${isOverdue
            ? `This is an overdue payment notice from <strong>${companyName}</strong>.`
            : `This is a friendly payment reminder from <strong>${companyName}</strong>.`
          }
        </p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;background:#f8fafc;border-radius:8px;overflow:hidden;">
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong>Invoice</strong></td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${invoice.invoice_number}</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong>Invoice total</strong></td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${formatAud(totalAmount)}</td></tr>
          ${partialRow}
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong>Amount due</strong></td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;">${amount}</td></tr>
          ${dueDateStr ? `<tr><td style="padding:10px 16px;"><strong>${isOverdue ? 'Was due' : 'Due date'}</strong></td><td style="padding:10px 16px;${isOverdue ? 'color:#dc2626;font-weight:600;' : ''}">${dueDateStr}</td></tr>` : ''}
        </table>
        <p style="margin:20px 0;">${viewBtn}${payBtn}</p>
        <p>If you have already made payment, please disregard this message. Thank you for your business.</p>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">${companyName}</p>
      </div>
    `;

    const subjectPrefix = isOverdue ? 'OVERDUE INVOICE' : 'Payment Reminder';
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
        subject: `${subjectPrefix}: ${invoice.invoice_number} — ${amount} — ${companyName}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return jsonResponse(502, { error: `Email delivery failed: ${errorText}` });
    }

    return jsonResponse(200, {
      invoice_id: invoiceId,
      to_email: toEmail,
      email_sent: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
