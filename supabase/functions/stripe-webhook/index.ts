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
      const bookingId = paymentIntent.metadata?.booking_id;
      const paidDate = new Date().toISOString().slice(0, 10);
      const stripeAmount = paymentIntent.amount / 100;

      if (documentType === 'invoice' && invoiceId) {
        const { data: inv } = await adminClient
          .from('invoices')
          .select('total, paid_amount, booking_id')
          .eq('id', invoiceId)
          .maybeSingle();

        if (!inv) {
          return jsonResponse(404, { error: 'Invoice not found' });
        }

        const previousPaid = Number(inv.paid_amount ?? 0);
        const total = Number(inv.total ?? 0);
        const newPaidAmount = Math.min(previousPaid + stripeAmount, total);
        const isFullyPaid = newPaidAmount >= total;

        const { error } = await adminClient
          .from('invoices')
          .update({
            status: isFullyPaid ? 'paid' : 'partially_paid',
            paid_date: isFullyPaid ? paidDate : null,
            paid_amount: newPaidAmount,
          })
          .eq('id', invoiceId);

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        // Cascade to the linked booking when fully paid.
        // The DB trigger trg_invoice_paid_cascade handles this automatically,
        // but we also explicitly mark the booking here as a safety net for
        // environments where the trigger may not yet be deployed.
        if (isFullyPaid && inv.booking_id) {
          await adminClient
            .from('bookings')
            .update({
              paid_in_full_date: paidDate,
            })
            .eq('id', inv.booking_id)
            .is('paid_in_full_date', null);
        }
      }

      if (documentType === 'booking' && bookingId) {
        const { data: bk } = await adminClient
          .from('bookings')
          .select('id, payment_plan, deposit_amount, deposit_paid_amount, total_amount, paid_in_full_date')
          .eq('id', bookingId)
          .maybeSingle();

        if (!bk) {
          return jsonResponse(404, { error: 'Booking not found' });
        }

        const prevPaid = Number(bk.deposit_paid_amount ?? 0);
        const depositDue = Number(bk.deposit_amount ?? 0);
        const totalAmount = Number(bk.total_amount ?? 0);
        const newCumulativePaid = prevPaid + stripeAmount;

        const updatePayload: Record<string, unknown> = {
          deposit_paid_amount: newCumulativePaid,
        };

        if (newCumulativePaid >= depositDue && depositDue > 0) {
          updatePayload.deposit_paid_date = paidDate;
        }

        if (totalAmount > 0 && newCumulativePaid >= totalAmount && !bk.paid_in_full_date) {
          updatePayload.paid_in_full_date = paidDate;
        }

        const { error } = await adminClient
          .from('bookings')
          .update(updatePayload)
          .eq('id', bookingId);

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
