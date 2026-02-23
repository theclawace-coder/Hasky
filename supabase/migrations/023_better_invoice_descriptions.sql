-- Improve invoice line-item descriptions so they read
--   "Hire of <Machine Name> – <N> day(s)"
-- instead of the generic "<Machine Name> Hire".
-- Also back-fills existing invoice items where possible.

-- ─── 1. Replace create_invoice_from_booking with richer descriptions ─────────

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

  booking_days := (booking_row.end_date - booking_row.start_date) + 1;

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

-- ─── 2. Back-fill existing invoice items with richer descriptions ────────────
-- Only touches hire line items that still have the old generic pattern.

UPDATE public.invoice_items ii
SET description =
  'Hire of ' || m.name || ' – '
    || ii.quantity::int || CASE WHEN ii.quantity::int = 1 THEN ' day' ELSE ' days' END
    || ' (' || TO_CHAR(b.start_date, 'DD/MM/YY')
    || ' to ' || TO_CHAR(b.end_date, 'DD/MM/YY') || ')'
FROM public.invoices inv
JOIN public.bookings b ON b.id = inv.booking_id
JOIN public.booking_machines bm ON bm.booking_id = b.id
JOIN public.machines m ON m.id = bm.machine_id
WHERE ii.invoice_id = inv.id
  AND ii.description = m.name || ' Hire';

-- Also fix legacy "Hire charge" items where the booking still has a machine_id.
UPDATE public.invoice_items ii
SET description =
  'Hire of ' || m.name || ' – '
    || GREATEST((b.end_date - b.start_date) + 1, 1) || CASE WHEN GREATEST((b.end_date - b.start_date) + 1, 1) = 1 THEN ' day' ELSE ' days' END
    || ' (' || TO_CHAR(b.start_date, 'DD/MM/YY')
    || ' to ' || TO_CHAR(b.end_date, 'DD/MM/YY') || ')'
FROM public.invoices inv
JOIN public.bookings b ON b.id = inv.booking_id
JOIN public.machines m ON m.id = b.machine_id
WHERE ii.invoice_id = inv.id
  AND ii.description = 'Hire charge'
  AND b.machine_id IS NOT NULL;
