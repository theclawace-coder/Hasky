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

const hasStripePaymentsEnabled = async (
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
    return true;
  }

  return Boolean((Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '') && (Deno.env.get('STRIPE_SECRET_KEY') ?? ''));
};

const normalizeRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const createShareToken = () =>
  `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

const getAppBaseUrl = (req: Request) => {
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const body = await req.json() as {
      document_type?: DocumentType;
      document_id?: string;
      recipient_email?: string | null;
      send_email?: boolean;
    };

    const documentType = body.document_type;
    const documentId = body.document_id;
    const recipientEmail = String(body.recipient_email ?? '').trim().toLowerCase() || null;
    const sendEmail = body.send_email !== false;

    if (!documentType || !['quote', 'invoice'].includes(documentType)) {
      return jsonResponse(400, { error: 'document_type must be quote or invoice' });
    }
    if (!documentId) {
      return jsonResponse(400, { error: 'document_id is required' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required' });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const table = documentType === 'invoice' ? 'invoices' : 'quotes';
    const numberField = documentType === 'invoice' ? 'invoice_number' : 'quote_number';

    const { data: documentRow, error: documentError } = await userClient
      .from(table)
      .select(`
        id,
        company_id,
        customer_id,
        status,
        total,
        share_token,
        sent_to,
        ${numberField},
        customers(name, email),
        companies(name)
      `)
      .eq('id', documentId)
      .maybeSingle();

    if (documentError || !documentRow) {
      return jsonResponse(404, { error: 'Document not found or access denied' });
    }

    const customer = normalizeRelation<{ name?: string; email?: string }>(documentRow.customers as any);
    const company = normalizeRelation<{ name?: string }>(documentRow.companies as any);

    const toEmail = recipientEmail ?? customer?.email ?? null;
    if (sendEmail && !toEmail) {
      return jsonResponse(400, { error: 'No recipient email found for this customer' });
    }

    const shareToken = documentRow.share_token ?? createShareToken();
    const nowIso = new Date().toISOString();
    const nextStatus = documentRow.status === 'draft' ? 'sent' : documentRow.status;

    const { error: updateError } = await adminClient
      .from(table)
      .update({
        share_token: shareToken,
        sent_to: toEmail ?? documentRow.sent_to ?? null,
        sent_at: nowIso,
        status: nextStatus,
      })
      .eq('id', documentId);

    if (updateError) {
      return jsonResponse(500, { error: updateError.message });
    }

    const appBaseUrl = getAppBaseUrl(req);
    const shareUrl = `${appBaseUrl}/public/${documentType}/${shareToken}`;
    const hasPositiveBalance = Number(documentRow.total ?? 0) > 0;
    const stripeEnabled = await hasStripePaymentsEnabled(adminClient, documentRow.company_id);
    const payableStatuses = documentType === 'quote'
      ? ['draft', 'sent', 'accepted']
      : ['draft', 'sent', 'overdue'];
    const paymentUrl =
      hasPositiveBalance && stripeEnabled && payableStatuses.includes(documentRow.status)
        ? `${shareUrl}?pay=1`
        : null;

    if (sendEmail) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
      const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
      if (!resendApiKey || !resendFrom) {
        return jsonResponse(500, { error: 'RESEND_API_KEY and RESEND_FROM_EMAIL must be set' });
      }

      const number = documentRow[numberField as keyof typeof documentRow] as string;
      const title = documentType === 'invoice' ? 'Invoice' : 'Quote';
      const companyName = company?.name ?? 'HireBase';
      const customerName = customer?.name ?? 'there';

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
          <p>Hi ${customerName},</p>
          <p>${companyName} has shared ${title.toLowerCase()} <strong>${number}</strong> with you.</p>
          <p>
            <a href="${shareUrl}" style="display: inline-block; padding: 10px 14px; border-radius: 8px; background: #2563eb; color: #ffffff; text-decoration: none;">
              View ${title}
            </a>
          </p>
          ${paymentUrl ? `
            <p>
              <a href="${paymentUrl}" style="display: inline-block; padding: 10px 14px; border-radius: 8px; background: #059669; color: #ffffff; text-decoration: none;">
                Pay Online
              </a>
            </p>
          ` : ''}
          <p>You can download or print this document from the secure private link above.</p>
        </div>
      `;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [toEmail],
          subject: `${companyName} - ${title} ${number}`,
          html,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        return jsonResponse(502, { error: `Resend request failed: ${errorText}` });
      }
    }

    return jsonResponse(200, {
      document_type: documentType,
      document_id: documentId,
      share_url: shareUrl,
      payment_url: paymentUrl,
      to_email: toEmail,
      email_sent: sendEmail,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
