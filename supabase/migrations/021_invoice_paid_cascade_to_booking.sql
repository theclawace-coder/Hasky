-- When an invoice is marked as fully paid (status → 'paid'), automatically
-- cascade the payment status to the linked booking so the job reflects
-- the correct payment state without any manual intervention.

-- ============================================================
-- 1. Trigger function: cascade invoice paid → booking
-- ============================================================

create or replace function public.cascade_invoice_paid_to_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.booking_id is null then
    return NEW;
  end if;

  update public.bookings
  set
    paid_in_full_date = coalesce(paid_in_full_date, current_date),
    deposit_paid_amount = greatest(
      coalesce(deposit_paid_amount, 0),
      coalesce(deposit_amount, 0)
    ),
    deposit_paid_date = case
      when coalesce(deposit_amount, 0) > 0
        then coalesce(deposit_paid_date, current_date)
      else deposit_paid_date
    end
  where id = NEW.booking_id;

  return NEW;
end;
$$;

-- ============================================================
-- 2. Attach trigger to invoices table
-- ============================================================

drop trigger if exists trg_invoice_paid_cascade on public.invoices;

create trigger trg_invoice_paid_cascade
  after update of status on public.invoices
  for each row
  when (NEW.status = 'paid' and OLD.status is distinct from 'paid')
  execute function public.cascade_invoice_paid_to_booking();
