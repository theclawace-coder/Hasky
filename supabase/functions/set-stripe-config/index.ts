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

const normalize = (value: string | undefined) => String(value ?? '').trim();

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
      publishable_key?: string;
      secret_key?: string;
      webhook_secret?: string;
    };

    const publishableKey = normalize(body.publishable_key);
    const secretKey = normalize(body.secret_key);
    const webhookSecret = normalize(body.webhook_secret);

    if (!publishableKey.startsWith('pk_')) {
      return jsonResponse(400, { error: 'Publishable key must start with pk_' });
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

    const { data: userData } = await userClient.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('company_id, role, is_platform_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return jsonResponse(404, { error: 'Company profile not found' });
    }

    if (!profile.is_platform_admin && profile.role !== 'admin') {
      return jsonResponse(403, { error: 'Only company admins can update Stripe settings' });
    }

    const { data: existing, error: existingError } = await adminClient
      .from('company_stripe_keys')
      .select('secret_key, webhook_secret')
      .eq('company_id', profile.company_id)
      .maybeSingle();

    if (existingError) {
      return jsonResponse(500, { error: existingError.message });
    }

    const nextSecret = secretKey || existing?.secret_key || null;
    if (secretKey && !secretKey.startsWith('sk_')) {
      return jsonResponse(400, { error: 'Secret key must start with sk_' });
    }

    const nextWebhook = webhookSecret || existing?.webhook_secret || null;

    const row: Record<string, unknown> = {
      company_id: profile.company_id,
      publishable_key: publishableKey,
      is_active: true,
    };
    if (nextSecret) row.secret_key = nextSecret;
    if (nextWebhook) row.webhook_secret = nextWebhook;

    const { error: upsertError } = await adminClient
      .from('company_stripe_keys')
      .upsert(row, { onConflict: 'company_id' });

    if (upsertError) {
      return jsonResponse(500, { error: upsertError.message });
    }

    const hasSecret = Boolean(nextSecret);
    return jsonResponse(200, {
      publishable_key: publishableKey,
      has_secret_key: hasSecret,
      has_webhook_secret: Boolean(nextWebhook),
      configured: Boolean(publishableKey && hasSecret),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
