import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const promoteKey = (Deno.env.get('PROMOTE_PLATFORM_ADMIN_KEY') ?? '').trim();
    if (!promoteKey) {
      return jsonResponse(500, { error: 'PROMOTE_PLATFORM_ADMIN_KEY is required' });
    }

    const providedKey = (request.headers.get('x-admin-secret') ?? '').trim();
    if (!providedKey || providedKey !== promoteKey) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const targetEmail = (Deno.env.get('PLATFORM_ADMIN_EMAIL') ?? '').toLowerCase().trim();

    if (!targetEmail) {
      return jsonResponse(400, { error: 'PLATFORM_ADMIN_EMAIL is required' });
    }

    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return jsonResponse(400, { error: listError.message });
    }

    const match = users.users.find((user) => user.email?.toLowerCase() === targetEmail);

    if (!match) {
      return jsonResponse(404, { error: 'No user found for PLATFORM_ADMIN_EMAIL' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_platform_admin: true })
      .eq('id', match.id);

    if (updateError) {
      return jsonResponse(400, { error: updateError.message });
    }

    return jsonResponse(200, { success: true, user_id: match.id });
  } catch (error) {
    return jsonResponse(500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
