-- Migration 014: Link expenses to bookings and machines
-- Enables per-job and per-machine cost tracking for profitability reporting.

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS machine_id uuid REFERENCES public.machines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS expenses_booking_id_idx ON public.expenses(booking_id);
CREATE INDEX IF NOT EXISTS expenses_machine_id_idx ON public.expenses(machine_id);
