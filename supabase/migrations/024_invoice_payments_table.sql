-- Track individual payment records against invoices.
-- Allows multiple partial payments with timestamps, method, and notes.
-- Pairs with the existing `invoices.paid_amount` accumulator.

-- ─── 1. invoice_payments table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     uuid        NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  company_id     uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount         numeric     NOT NULL CHECK (amount > 0),
  payment_method text        NOT NULL DEFAULT 'cash',
  -- valid values: cash | bank_transfer | card | cheque | stripe | other
  payment_date   date        NOT NULL DEFAULT current_date,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can manage their invoice payments"
  ON public.invoice_payments FOR ALL
  USING (company_id = public.current_company_id() OR public.is_platform_admin());

-- Index for fast per-invoice history lookups.
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_id_idx
  ON public.invoice_payments (invoice_id, created_at ASC);

-- ─── 2. Backfill: create payment records for already-paid invoices ────────────
-- Where paid_amount > 0 but no record exists yet, insert a single "Cash" entry
-- using the invoice's paid_date (or today as fallback).

INSERT INTO public.invoice_payments (invoice_id, company_id, amount, payment_method, payment_date, notes, created_at)
SELECT
  i.id,
  i.company_id,
  i.paid_amount,
  'cash',
  COALESCE(i.paid_date, i.created_at::date),
  'Migrated from existing record',
  COALESCE(i.paid_date::timestamptz, i.created_at)
FROM public.invoices i
WHERE i.paid_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.invoice_payments ip WHERE ip.invoice_id = i.id
  );

-- ─── 3. Replace record_invoice_payment to also insert a payment record ────────

CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount     numeric,
  p_method     text    DEFAULT 'cash',
  p_notes      text    DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_row public.invoices;
  new_paid    numeric;
BEGIN
  SELECT * INTO invoice_row
  FROM public.invoices
  WHERE id = p_invoice_id;

  IF invoice_row.id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT (invoice_row.company_id = public.current_company_id() OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  new_paid := LEAST(COALESCE(invoice_row.paid_amount, 0) + p_amount, invoice_row.total);

  -- Record the individual payment.
  INSERT INTO public.invoice_payments (invoice_id, company_id, amount, payment_method, notes)
  VALUES (p_invoice_id, invoice_row.company_id, p_amount, COALESCE(p_method, 'cash'), p_notes);

  -- Accumulate on the invoice.
  UPDATE public.invoices
  SET
    paid_amount = new_paid,
    status      = CASE
                    WHEN new_paid >= total THEN 'paid'
                    WHEN status = 'draft'  THEN 'sent'
                    ELSE status
                  END,
    paid_date   = CASE
                    WHEN new_paid >= total THEN COALESCE(paid_date, current_date)
                    ELSE paid_date
                  END
  WHERE id = p_invoice_id
  RETURNING * INTO invoice_row;

  RETURN invoice_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_invoice_payment(uuid, numeric, text, text) TO authenticated;

-- Also keep the old 2-arg signature working (for any cached calls).
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount     numeric
)
RETURNS public.invoices
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.record_invoice_payment(p_invoice_id, p_amount, 'cash', NULL);
$$;

GRANT EXECUTE ON FUNCTION public.record_invoice_payment(uuid, numeric) TO authenticated;
