-- Multi-machine bookings: introduce the booking_machines junction table so that
-- a single booking can span more than one machine.
--
-- Backward-compat approach:
--   • bookings.machine_id becomes nullable but keeps pointing to the PRIMARY machine
--     (machines[0]) so existing RPCs, triggers, and queries continue to work.
--   • booking_machines is the canonical source of truth for all machines on a booking.
--   • All existing bookings are backfilled with one booking_machines row each.

-- ─── 1. booking_machines junction table ───────────────────────────────────────

CREATE TABLE public.booking_machines (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid        NOT NULL REFERENCES public.bookings(id)  ON DELETE CASCADE,
  machine_id   uuid        NOT NULL REFERENCES public.machines(id)  ON DELETE RESTRICT,
  machine_order int        NOT NULL DEFAULT 0,
  rate_type    text        CHECK (rate_type IN ('hourly','daily','weekly','monthly')),
  rate_amount  numeric     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, machine_id)
);

CREATE INDEX ON public.booking_machines (booking_id);
CREATE INDEX ON public.booking_machines (machine_id);

-- ─── 2. RLS (mirrors booking_charge_items pattern) ────────────────────────────

ALTER TABLE public.booking_machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation" ON public.booking_machines
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.company_id = public.current_company_id() OR public.is_platform_admin())
    )
  );

GRANT ALL ON public.booking_machines TO authenticated;

-- ─── 3. Backfill one row per existing booking ─────────────────────────────────

INSERT INTO public.booking_machines (booking_id, machine_id, machine_order, rate_type, rate_amount)
SELECT
  id,
  machine_id,
  0,
  rate_type,
  COALESCE(rate_amount, 0)
FROM public.bookings
WHERE machine_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─── 4. Make bookings.machine_id nullable ─────────────────────────────────────

ALTER TABLE public.bookings ALTER COLUMN machine_id DROP NOT NULL;

-- ─── 5. Update the double-booking overlap check ───────────────────────────────
--
-- The existing trigger fires on bookings INSERT/UPDATE and checks bookings.machine_id.
-- We extend it to also check ALL machines in booking_machines, so that when a
-- booking is confirmed with multiple machines every one of them is validated.

CREATE OR REPLACE FUNCTION public.check_booking_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce for confirmed bookings; quotes/completed/cancelled are fine.
  IF NEW.status = 'confirmed' THEN

    -- (a) Primary machine — backward compat, same logic as before.
    IF NEW.machine_id IS NOT NULL THEN
      IF EXISTS (
        SELECT 1
        FROM public.bookings
        WHERE machine_id  = NEW.machine_id
          AND status      = 'confirmed'
          AND id         != NEW.id
          AND NEW.start_date <= end_date
          AND NEW.end_date   >= start_date
      ) THEN
        RAISE EXCEPTION
          'Machine is already confirmed for those dates — please choose different dates or a different machine.';
      END IF;
    END IF;

    -- (b) Additional machines from booking_machines.
    --     Checks every machine attached to this booking against all OTHER
    --     confirmed bookings that overlap the same date range.
    IF EXISTS (
      SELECT 1
      FROM public.booking_machines bm_new
      JOIN public.booking_machines bm_other ON bm_other.machine_id = bm_new.machine_id
      JOIN public.bookings         b_other  ON b_other.id          = bm_other.booking_id
      WHERE bm_new.booking_id  = NEW.id
        AND bm_other.booking_id <> NEW.id
        AND b_other.status      = 'confirmed'
        AND NEW.start_date     <= b_other.end_date
        AND NEW.end_date       >= b_other.start_date
    ) THEN
      RAISE EXCEPTION
        'One or more machines are already confirmed for those dates — please review your machine selection.';
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

-- Re-attach the trigger (function replacement is in-place; trigger stays attached).
DROP TRIGGER IF EXISTS trg_booking_no_overlap ON public.bookings;
CREATE TRIGGER trg_booking_no_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_booking_no_overlap();

-- ─── 6. Update set_booking_and_machine_status to handle all machines ──────────

CREATE OR REPLACE FUNCTION public.set_booking_and_machine_status(
  p_booking_id     uuid,
  p_booking_status text,
  p_machine_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row public.bookings;
BEGIN
  SELECT * INTO booking_row FROM public.bookings b WHERE b.id = p_booking_id;

  IF booking_row.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF NOT (booking_row.company_id = public.current_company_id() OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update booking status (this fires the overlap check trigger when confirming).
  UPDATE public.bookings
  SET status = p_booking_status
  WHERE id = p_booking_id;

  -- Update ALL machines in booking_machines for this booking.
  UPDATE public.machines
  SET status = p_machine_status
  WHERE id IN (
    SELECT machine_id FROM public.booking_machines WHERE booking_id = p_booking_id
  );

  -- Fallback: also update primary machine_id if it exists but isn't in booking_machines.
  IF booking_row.machine_id IS NOT NULL THEN
    UPDATE public.machines
    SET status = p_machine_status
    WHERE id = booking_row.machine_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_booking_and_machine_status(uuid, text, text) TO authenticated;

-- ─── 7. Update create_invoice_from_booking to emit per-machine line items ─────

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

  -- Days duration (inclusive).
  booking_days := (booking_row.end_date - booking_row.start_date) + 1;

  -- How many machines are in booking_machines?
  SELECT COUNT(*) INTO machine_count
  FROM public.booking_machines WHERE booking_id = p_booking_id;

  IF machine_count > 0 THEN
    -- NEW PATH: sum hire across all machines in booking_machines.
    SELECT ROUND(COALESCE(SUM(bm.rate_amount * booking_days), 0), 2)
    INTO hire_subtotal_value
    FROM public.booking_machines bm
    WHERE bm.booking_id = p_booking_id;
  ELSE
    -- LEGACY PATH: single machine from booking row.
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
    -- One line item per machine: "{Machine Name} Hire (N days)"
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price)
    SELECT
      invoice_id_value,
      m.name || ' Hire',
      booking_days,
      bm.rate_amount
    FROM public.booking_machines bm
    JOIN public.machines m ON m.id = bm.machine_id
    WHERE bm.booking_id = p_booking_id
    ORDER BY bm.machine_order;
  ELSE
    -- Legacy: single "Hire charge" line item.
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price)
    VALUES (invoice_id_value, 'Hire charge', 1, hire_subtotal_value);
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
