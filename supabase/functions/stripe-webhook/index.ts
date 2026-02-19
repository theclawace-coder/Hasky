import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' });
    }
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return jsonResponse(400, { error: 'Missing stripe-signature header' });
    }

    const payload = await req.text();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder', { apiVersion: '2024-06-20' });

    const { data: companySecrets, error: secretsError } = await adminClient
      .from('company_stripe_keys')
      .select('webhook_secret')
      .eq('is_active', true)
      .not('webhook_secret', 'is', null);

    if (secretsError) {
      return jsonResponse(500, { error: secretsError.message });
    }

    const candidateSecrets = new Set<string>();
    const globalSecret = (Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '').trim();
    if (globalSecret) {
      candidateSecrets.add(globalSecret);
    }
    (companySecrets ?? []).forEach((row: { webhook_secret?: string | null }) => {
      const value = String(row.webhook_secret ?? '').trim();
      if (value) {
        candidateSecrets.add(value);
      }
    });

    if (candidateSecrets.size === 0) {
      return jsonResponse(500, { error: 'No Stripe webhook secrets configured' });
    }

    let event: Stripe.Event | null = null;
    for (const secret of candidateSecrets) {
      try {
        event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
        break;
      } catch {
        // Try the next known webhook secret.
      }
    }

    if (!event) {
      return jsonResponse(400, { error: 'Invalid webhook signature' });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const documentType = paymentIntent.metadata?.document_type;
      const invoiceId = paymentIntent.metadata?.invoice_id;
      const quoteId = paymentIntent.metadata?.quote_id;
      const paidDate = new Date().toISOString().slice(0, 10);

      if (documentType === 'invoice' && invoiceId) {
        const { error } = await adminClient
          .from('invoices')
          .update({ status: 'paid', paid_date: paidDate })
          .eq('id', invoiceId);

        if (error) {
          return jsonResponse(500, { error: error.message });
        }
      }

      if (documentType === 'quote' && quoteId) {
        const { error } = await adminClient
          .from('quotes')
          .update({ status: 'paid', paid_date: paidDate })
          .eq('id', quoteId);

        if (error) {
          return jsonResponse(500, { error: error.message });
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse(400, { error: message });
  }
});
