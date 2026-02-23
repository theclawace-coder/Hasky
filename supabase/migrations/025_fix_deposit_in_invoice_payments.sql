-- ─── 025: Fix deposit credit not appearing in invoice_payments ────────────────
--
-- ROOT CAUSE:
--   create_invoice_from_booking correctly sets invoice.paid_amount = deposit_paid_amount
--   (so the invoice shows "Amount Paid: $X"), but it never inserts a row into
--   invoice_payments. The Payment History section therefore shows nothing, which
--   makes operators think the deposit wasn't recorded — they click "Record Payment"
--   again, which doubles the paid_amount (e.g. $9.97 → $19.94).
--
-- FIX:
--   1. Rebuild create_invoice_from_booking to also insert into invoice_payments
--      whenever prior_paid > 0.
--   2. Backfill: for any existing invoice where paid_amount > SUM(invoice_payments),
--      insert the missing "Deposit received at booking" record so the history is
--      consistent with the displayed Amount Paid.
--
-- NOTE on already-doubled invoices (e.g. BOK-JI-0007):
--   If an operator already manually re-recorded the deposit, the invoice will show
--   paid_amount = 2× deposit and invoice_payments will have ONE manual record.
--   After this backfill, the history will show TWO rows (deposit + manual re-entry)
--   and the total will be consistent. To fully correct those invoices run the
--   diagnostic query at the bottom of this file.

-- ─── 1. Rebuild create_invoice_from_booking ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_invoice_from_booking(p_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row            public.bookings;
  invoice_id_value       uuid;
  due_date_value         date;
  invoice_number_value   text;
  hire_subtotal_value    numeric;
  extras_subtotal_value  numeric;
  subtotal_value         numeric;
  total_value            numeric;
  prior_paid             numeric;
  invoice_status         text;
  invoice_paid_date      date;
  booking_days           int;
  machine_count          int;
  deposit_date_value     date;
  deposit_note_value     text;
BEGIN
  SELECT * INTO booking_row FROM public.bookings b WHERE b.id = p_booking_id;

  IF booking_row.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  invoice_number_value := public.generate_document_number(booking_row.company_id, 'INV');

  due_date_value := COALESCE((
    SELECT (current_date + make_interval(days => cs.payment_terms_days))::date
    FROM public.company_settings cs
    WHERE cs.company_id = booking_row.company_id
  ), current_date + interval '14 days');

  booking_days := GREATEST((booking_row.end_date - booking_row.start_date) + 1, 1);

  SELECT COUNT(*) INTO machine_count
  FROM public.booking_machines WHERE booking_id = p_booking_id;

  IF machine_count > 0 THEN
    SELECT ROUND(COALESCE(SUM(bm.rate_amount * booking_days), 0), 2)
    INTO hire_subtotal_value
    FROM public.booking_machines bm
    WHERE bm.booking_id = p_booking_id;
  ELSE
    hire_subtotal_value := ROUND(
      COALESCE(booking_row.hire_subtotal, booking_row.total_amount, booking_row.rate_amount, 0),
      2
    );
  END IF;

  extras_subtotal_value := ROUND(COALESCE((
    SELECT SUM(COALESCE(bci.quantity, 0) * COALESCE(bci.unit_price, 0))
    FROM public.booking_charge_items bci
    WHERE bci.booking_id = p_booking_id
  ), COALESCE(booking_row.extras_subtotal, 0), 0), 2);

  subtotal_value := hire_subtotal_value + extras_subtotal_value;
  total_value    := ROUND(subtotal_value * 1.10, 2);

  -- Credit any payment already received at the booking stage.
  prior_paid := CASE
    WHEN booking_row.payment_plan = 'upfront'
         AND booking_row.paid_in_full_date IS NOT NULL
      THEN total_value
    WHEN booking_row.payment_plan = 'deposit'
      THEN LEAST(COALESCE(booking_row.deposit_paid_amount, 0), total_value)
    ELSE 0
  END;

  invoice_status := CASE
    WHEN prior_paid >= total_value THEN 'paid'
    ELSE 'draft'
  END;

  invoice_paid_date := CASE
    WHEN prior_paid >= total_value
      THEN COALESCE(booking_row.paid_in_full_date, booking_row.deposit_paid_date, current_date)
    ELSE NULL
  END;

  -- Payment history metadata for the credit row.
  deposit_date_value := COALESCE(
    booking_row.deposit_paid_date,
    booking_row.paid_in_full_date,
    current_date
  );
  deposit_note_value := CASE
    WHEN booking_row.payment_plan = 'upfront' THEN 'Paid in full at booking (upfront)'
    ELSE 'Deposit received at booking'
  END;

  -- ── Create the invoice ──────────────────────────────────────────────────────
  INSERT INTO public.invoices (
    company_id, booking_id, customer_id, invoice_number,
    subtotal, gst, total, paid_amount, status, paid_date, due_date, notes
  )
  VALUES (
    booking_row.company_id, booking_row.id, booking_row.customer_id, invoice_number_value,
    subtotal_value,
    ROUND(subtotal_value * 0.10, 2),
    total_value,
    prior_paid,
    invoice_status,
    invoice_paid_date,
    due_date_value,
    booking_row.notes
  )
  RETURNING id INTO invoice_id_value;

  -- ── Record the initial deposit/upfront credit in invoice_payments ───────────
  -- This ensures the Payment History section always shows the deposit row and
  -- prevents operators from re-recording it manually (which causes doubling).
  IF prior_paid > 0 THEN
    INSERT INTO public.invoice_payments (
      invoice_id, company_id, amount, payment_method, payment_date, notes
    )
    VALUES (
      invoice_id_value,
      booking_row.company_id,
      prior_paid,
      'cash',
      deposit_date_value,
      deposit_note_value
    );
  END IF;

  -- ── Hire line items ──────────────────────────────────────────────────────────
  IF machine_count > 0 THEN
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price)
    SELECT
      invoice_id_value,
      'Hire of ' || m.name || ' – '
        || booking_days || CASE WHEN booking_days = 1 THEN ' day' ELSE ' days' END
        || ' (' || TO_CHAR(booking_row.start_date, 'DD/MM/YY')
        || ' to ' || TO_CHAR(booking_row.end_date, 'DD/MM/YY') || ')',
      booking_days,
      bm.rate_amount
    FROM public.booking_machines bm
    JOIN public.machines m ON m.id = bm.machine_id
    WHERE bm.booking_id = p_booking_id
    ORDER BY bm.machine_order;
  ELSE
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price)
    VALUES (
      invoice_id_value,
      'Hire of ' || COALESCE(
        (SELECT m.name FROM public.machines m WHERE m.id = booking_row.machine_id),
        'equipment'
      ) || ' – '
        || booking_days || CASE WHEN booking_days = 1 THEN ' day' ELSE ' days' END
        || ' (' || TO_CHAR(booking_row.start_date, 'DD/MM/YY')
        || ' to ' || TO_CHAR(booking_row.end_date, 'DD/MM/YY') || ')',
      1,
      hire_subtotal_value
    );
  END IF;

  -- ── Extras line items ────────────────────────────────────────────────────────
  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price)
  SELECT invoice_id_value, bci.description, bci.quantity, bci.unit_price
  FROM public.booking_charge_items bci
  WHERE bci.booking_id = p_booking_id;

  RETURN invoice_id_value;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_invoice_from_booking(uuid) TO authenticated;

-- ─── 2. Backfill: insert missing deposit rows for existing invoices ────────────
-- For any invoice where paid_amount > SUM(invoice_payments), the deposit credit
-- was applied directly (by the old function) but never recorded in the history
-- table. Insert the gap so the history total matches the displayed Amount Paid.

WITH paid_so_far AS (
  SELECT invoice_id, COALESCE(SUM(amount), 0) AS total_recorded
  FROM   public.invoice_payments
  GROUP  BY invoice_id
)
INSERT INTO public.invoice_payments (invoice_id, company_id, amount, payment_method, payment_date, notes)
SELECT
  i.id,
  i.company_id,
  -- Insert only the unrecorded portion (gap between paid_amount and what's in history).
  i.paid_amount - COALESCE(ps.total_recorded, 0),
  'cash',
  COALESCE(i.paid_date, i.created_at::date),
  CASE
    WHEN b.payment_plan = 'upfront' THEN 'Paid in full at booking (upfront)'
    ELSE 'Deposit received at booking'
  END
FROM   public.invoices i
LEFT JOIN public.bookings b  ON b.id = i.booking_id
LEFT JOIN paid_so_far ps ON ps.invoice_id = i.id
WHERE  i.paid_amount > 0
  AND  i.paid_amount > COALESCE(ps.total_recorded, 0)
  AND  i.paid_amount <= i.total;   -- Safety: ignore any data anomaly where paid_amount > total

-- ─── 3. Diagnostic (informational only — not executed automatically) ──────────
-- Run this manually to identify invoices where paid_amount is higher than
-- what a single deposit should be (possible double-count candidates):
--
-- SELECT
--   i.invoice_number,
--   b.booking_number,
--   i.total,
--   i.paid_amount,
--   (SELECT SUM(amount) FROM invoice_payments ip WHERE ip.invoice_id = i.id) AS history_sum,
--   i.paid_amount - COALESCE(b.deposit_paid_amount, 0) AS overcount_by
-- FROM invoices i
-- LEFT JOIN bookings b ON b.id = i.booking_id
-- WHERE i.paid_amount > COALESCE(b.deposit_paid_amount, 0)
--   AND i.status != 'paid'
-- ORDER BY i.created_at DESC;
--
-- To roll back a specific double-counted invoice (replace <invoice_id>):
-- BEGIN;
--   -- Delete the manual re-entry (keep the 'Deposit received at booking' row):
--   DELETE FROM invoice_payments
--   WHERE invoice_id = '<invoice_id>'
--     AND notes IS DISTINCT FROM 'Deposit received at booking'
--     AND created_at = (
--       SELECT MAX(created_at) FROM invoice_payments WHERE invoice_id = '<invoice_id>'
--     );
--   -- Reset paid_amount to match the deposit:
--   UPDATE invoices
--   SET paid_amount = (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = '<invoice_id>'),
--       status = CASE
--         WHEN (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = '<invoice_id>') >= total THEN 'paid'
--         WHEN (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = '<invoice_id>') > 0 THEN 'partially_paid'
--         ELSE status
--       END
--   WHERE id = '<invoice_id>';
-- COMMIT;
