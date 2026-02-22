-- Migration 013: Auto-overdue invoices via pg_cron
-- Runs daily at 02:00 UTC. Flips 'sent' invoices past their due_date to 'overdue'.
-- Only 'sent' invoices are touched — drafts, paid, and cancelled are never affected.
--
-- After applying this migration, verify with:
--   SELECT jobname, schedule, command FROM cron.job;
--
-- To test immediately without waiting for the schedule, run:
--   UPDATE public.invoices
--   SET status = 'overdue', updated_at = now()
--   WHERE status = 'sent' AND due_date < CURRENT_DATE;

-- Enable pg_cron extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove previous schedule if it exists (makes this migration idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('mark-invoices-overdue');
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Schedule: every day at 02:00 UTC
SELECT cron.schedule(
  'mark-invoices-overdue',
  '0 2 * * *',
  $$
    UPDATE public.invoices
    SET    status     = 'overdue',
           updated_at = now()
    WHERE  status   = 'sent'
      AND  due_date < CURRENT_DATE;
  $$
);
