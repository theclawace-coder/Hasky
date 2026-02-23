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

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    company_id?: string;
    full_name?: string;
    phone?: string | null;
    role?: string;
    created_at?: string;
  };
  old_record?: unknown;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = (await req.json()) as WebhookPayload;
    const record = body?.record;

    if (!record?.id || !record?.company_id) {
      return jsonResponse(400, { error: 'Invalid payload: missing record.id or record.company_id' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const resendDomain = (Deno.env.get('RESEND_FROM_DOMAIN') ?? '').trim();
    const resendFromEmail = (Deno.env.get('RESEND_FROM_EMAIL') ?? '').trim();
    const platformAdminEmail = Deno.env.get('PLATFORM_ADMIN_EMAIL') ?? '';

    const platformFrom = resendDomain
      ? `Hasky <notifications@${resendDomain}>`
      : resendFromEmail;

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(500, { error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' });
    }
    if (!resendApiKey || !platformFrom) {
      return jsonResponse(500, { error: 'RESEND_API_KEY and either RESEND_FROM_DOMAIN or RESEND_FROM_EMAIL must be set' });
    }
    if (!platformAdminEmail) {
      return jsonResponse(500, { error: 'PLATFORM_ADMIN_EMAIL must be set' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch company name
    const { data: company } = await adminClient
      .from('companies')
      .select('name')
      .eq('id', record.company_id)
      .maybeSingle();

    // Fetch user email from auth.users
    const { data: authUser } = await adminClient.auth.admin.getUserById(record.id);
    const userEmail = authUser?.user?.email ?? '(email not available)';

    const fullName = record.full_name ?? 'Unknown';
    const companyName = company?.name ?? 'Unknown company';

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <p><strong>New user signed up on Hasky</strong></p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Signed up at:</strong> ${record.created_at ?? new Date().toISOString()}</p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: platformFrom,
        to: [platformAdminEmail.trim().toLowerCase()],
        subject: `Hasky: New user – ${fullName} (${companyName})`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return jsonResponse(502, { error: `Resend request failed: ${errorText}` });
    }

    return jsonResponse(200, {
      ok: true,
      sent_to: platformAdminEmail,
      user: fullName,
      company: companyName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
