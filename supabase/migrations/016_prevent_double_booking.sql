-- Prevent double-booking: make end_date required and add a trigger that blocks
-- overlapping confirmed bookings for the same machine.

-- 1. Backfill any existing rows that have a NULL end_date.
UPDATE public.bookings
SET end_date = start_date
WHERE end_date IS NULL;

-- 2. Make end_date mandatory going forward.
ALTER TABLE public.bookings
  ALTER COLUMN end_date SET NOT NULL;

-- 3. Function called by the trigger below.
--    Raises an exception when a 'confirmed' booking would overlap another
--    confirmed booking on the same machine.
CREATE OR REPLACE FUNCTION public.check_booking_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce for confirmed bookings; quotes/completed/cancelled are fine.
  IF NEW.status = 'confirmed' THEN
    IF EXISTS (
      SELECT 1
      FROM public.bookings
      WHERE machine_id  = NEW.machine_id
        AND status      = 'confirmed'
        AND id         != NEW.id          -- exclude self on UPDATE
        AND NEW.start_date <= end_date
        AND NEW.end_date   >= start_date
    ) THEN
      RAISE EXCEPTION
        'Machine is already confirmed for those dates — please choose different dates or a different machine.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach the trigger (drop first to allow re-running this migration).
DROP TRIGGER IF EXISTS trg_booking_no_overlap ON public.bookings;
CREATE TRIGGER trg_booking_no_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_booking_no_overlap();
