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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Unauthorized' });
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
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return jsonResponse(404, { error: 'Company profile not found' });
    }

    const { data: stripeConfig, error: stripeError } = await adminClient
      .from('company_stripe_keys')
      .select('publishable_key, secret_key, webhook_secret, is_active')
      .eq('company_id', profile.company_id)
      .maybeSingle();

    if (stripeError) {
      return jsonResponse(500, { error: stripeError.message });
    }

    const publishableKey = stripeConfig?.publishable_key ?? null;
    const hasSecretKey = Boolean(stripeConfig?.secret_key);
    const hasWebhookSecret = Boolean(stripeConfig?.webhook_secret);
    const configured = Boolean(stripeConfig?.is_active && publishableKey && hasSecretKey);

    return jsonResponse(200, {
      publishable_key: publishableKey,
      has_secret_key: hasSecretKey,
      has_webhook_secret: hasWebhookSecret,
      configured,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(500, { error: message });
  }
});
