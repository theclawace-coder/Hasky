import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

Deno.serve(async () => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const targetEmail = (Deno.env.get('PLATFORM_ADMIN_EMAIL') ?? '').toLowerCase().trim();

    if (!targetEmail) {
      return new Response(JSON.stringify({ error: 'PLATFORM_ADMIN_EMAIL is required' }), { status: 400 });
    }

    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), { status: 400 });
    }

    const match = users.users.find((user) => user.email?.toLowerCase() === targetEmail);

    if (!match) {
      return new Response(JSON.stringify({ error: 'No user found for PLATFORM_ADMIN_EMAIL' }), { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_platform_admin: true })
      .eq('id', match.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, user_id: match.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
