import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const role = String(body.role ?? 'user');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 403 });
    }

    if (profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can invite users' }), { status: 403 });
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin.from('team_invites').insert({
      company_id: profile.company_id,
      email,
      role,
      invited_by: user.id,
      status: 'pending',
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
