-- Migration 011: Booking reference numbers (BOK-HB-0001)
-- Adds a human-readable booking_number to every booking,
-- mirroring how invoices (INV-HB-0001) and quotes (QUO-HB-0001) work.

-- Step 1: Add column (nullable so backfill can run before NOT NULL is enforced)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_number text;

-- Step 2: Extend generate_document_number to handle 'BOK' (and any future prefix)
CREATE OR REPLACE FUNCTION public.generate_document_number(p_company_id uuid, p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_name_value text;
  initials text;
  count_value int;
BEGIN
  SELECT c.name INTO company_name_value FROM public.companies c WHERE c.id = p_company_id;
  initials := COALESCE((
    SELECT string_agg(UPPER(LEFT(part, 1)), '')
    FROM regexp_split_to_table(COALESCE(company_name_value, 'HB'), '\s+') AS part
  ), 'HB');

  IF p_prefix = 'INV' THEN
    SELECT COUNT(*) + 1 INTO count_value FROM public.invoices WHERE company_id = p_company_id;
  ELSIF p_prefix = 'QUO' THEN
    SELECT COUNT(*) + 1 INTO count_value FROM public.quotes WHERE company_id = p_company_id;
  ELSE
    -- 'BOK' and any future prefixes default to counting bookings
    SELECT COUNT(*) + 1 INTO count_value FROM public.bookings WHERE company_id = p_company_id;
  END IF;

  RETURN format('%s-%s-%s', UPPER(p_prefix), initials, LPAD(count_value::text, 4, '0'));
END;
$$;

-- Step 3: Backfill existing bookings with stable, ordered numbers
WITH ranked AS (
  SELECT
    b.id,
    'BOK-' || COALESCE(
      (
        SELECT string_agg(UPPER(LEFT(part, 1)), '')
        FROM regexp_split_to_table(COALESCE(c.name, 'HireHub'), '\s+') AS part
      ),
      'HB'
    ) || '-' || LPAD(
      ROW_NUMBER() OVER (PARTITION BY b.company_id ORDER BY b.created_at)::text,
      4,
      '0'
    ) AS booking_number
  FROM public.bookings b
  JOIN public.companies c ON c.id = b.company_id
  WHERE b.booking_number IS NULL
)
UPDATE public.bookings
SET booking_number = ranked.booking_number
FROM ranked
WHERE public.bookings.id = ranked.id;

-- Step 4: Trigger function — auto-fills booking_number on every INSERT
CREATE OR REPLACE FUNCTION public.auto_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_document_number(NEW.company_id, 'BOK');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_number ON public.bookings;
CREATE TRIGGER set_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.auto_booking_number();
