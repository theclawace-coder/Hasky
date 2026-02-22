-- Migration 012: Quote hire dates
-- Adds hire_start_date and hire_end_date to quotes so that the actual hire period
-- can be captured separately from the quote document's issue/expiry dates.
-- Updates convert_quote_to_booking to prefer hire dates, falling back to issue/expiry dates.

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS hire_start_date date,
  ADD COLUMN IF NOT EXISTS hire_end_date date;

-- Update convert_quote_to_booking to use dedicated hire dates
CREATE OR REPLACE FUNCTION public.convert_quote_to_booking(p_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_row public.quotes;
  booking_id_value uuid;
  rate numeric;
BEGIN
  SELECT * INTO quote_row FROM public.quotes q WHERE q.id = p_quote_id;
  IF quote_row.id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  IF quote_row.machine_id IS NULL THEN
    RAISE EXCEPTION 'Quote machine is required for conversion';
  END IF;

  rate := COALESCE(quote_row.total, 0);

  INSERT INTO public.bookings (
    company_id,
    machine_id,
    customer_id,
    quote_id,
    status,
    start_date,
    end_date,
    rate_type,
    rate_amount,
    total_amount
  )
  VALUES (
    quote_row.company_id,
    quote_row.machine_id,
    quote_row.customer_id,
    quote_row.id,
    'confirmed',
    COALESCE(quote_row.hire_start_date, quote_row.issue_date),
    COALESCE(quote_row.hire_end_date, quote_row.expiry_date),
    'daily',
    rate,
    rate
  )
  RETURNING id INTO booking_id_value;

  UPDATE public.quotes
  SET status = CASE WHEN status = 'paid' THEN 'paid' ELSE 'accepted' END
  WHERE id = p_quote_id;

  RETURN booking_id_value;
END;
$$;
