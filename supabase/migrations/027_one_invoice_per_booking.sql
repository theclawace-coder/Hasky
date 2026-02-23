-- Prevent duplicate invoices for the same booking.
-- A booking should have at most one invoice. If it needs to be re-issued,
-- the existing one should be deleted/cancelled first.

-- ─── 0. Deduplicate existing data ────────────────────────────────────────────
-- Some bookings accumulated multiple invoices before this guard existed.
-- For each booking, keep the single "best" invoice:
--   priority: paid > partially_paid > sent > draft (highest status wins)
--   tiebreaker: latest created_at
-- All other invoice_items / invoice_payments rows are cascade-deleted.

WITH status_rank AS (
  SELECT id,
         booking_id,
         CASE status
           WHEN 'paid'           THEN 4
           WHEN 'partially_paid' THEN 3
           WHEN 'sent'           THEN 2
           WHEN 'overdue'        THEN 2
           ELSE 1                        -- draft
         END AS rank,
         created_at
  FROM public.invoices
  WHERE booking_id IS NOT NULL
),
keepers AS (
  -- The one invoice to keep per booking (highest rank, latest created)
  SELECT DISTINCT ON (booking_id) id
  FROM status_rank
  ORDER BY booking_id, rank DESC, created_at DESC
)
DELETE FROM public.invoices
WHERE booking_id IS NOT NULL
  AND id NOT IN (SELECT id FROM keepers);

-- ─── 1. Unique constraint on invoices.booking_id ─────────────────────────────
-- Allow NULLs (standalone invoices not tied to a booking are fine).

CREATE UNIQUE INDEX IF NOT EXISTS invoices_booking_id_unique
  ON public.invoices (booking_id)
  WHERE booking_id IS NOT NULL;

-- ─── 2. Note ──────────────────────────────────────────────────────────────────
-- The duplicate-invoice guard is already present in create_invoice_from_booking
-- as restored by migration 026. No function redefinition needed here.
