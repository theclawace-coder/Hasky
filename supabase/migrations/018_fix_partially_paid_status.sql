-- Fix: record_invoice_payment was not transitioning invoices to 'partially_paid'
-- when a partial payment was recorded. The status stayed as 'sent' or 'overdue'.
-- Also fixes create_invoice_from_booking to set 'partially_paid' when a deposit
-- has been credited but doesn't cover the full invoice total.

-- ============================================================
-- 0. Add 'partially_paid' to the invoices status check constraint
-- ============================================================

-- The original constraint from 001_initial_schema only allows:
--   ('draft', 'sent', 'paid', 'overdue', 'cancelled')
-- We need to drop it and recreate with 'partially_paid' included.

alter table public.invoices drop constraint if exists invoices_status_check;

do $$
begin
  -- Also handle the unnamed inline check from the column definition
  declare
    con_name text;
  begin
    select conname into con_name
    from pg_constraint
    where conrelid = 'public.invoices'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%';
    if con_name is not null then
      execute format('alter table public.invoices drop constraint %I', con_name);
    end if;
  end;
end $$;

alter table public.invoices
  add constraint invoices_status_check
  check (status in ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'));

-- ============================================================
-- 1. Fix record_invoice_payment
-- ============================================================

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount     numeric
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row public.invoices;
  new_paid    numeric;
begin
  select * into invoice_row
  from public.invoices
  where id = p_invoice_id;

  if invoice_row.id is null then
    raise exception 'Invoice not found';
  end if;

  if not (invoice_row.company_id = public.current_company_id() or public.is_platform_admin()) then
    raise exception 'Access denied';
  end if;

  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  new_paid := least(coalesce(invoice_row.paid_amount, 0) + p_amount, invoice_row.total);

  update public.invoices
  set
    paid_amount = new_paid,
    status      = case
                    when new_paid >= total then 'paid'
                    when new_paid > 0      then 'partially_paid'
                    else status
                  end,
    paid_date   = case
                    when new_paid >= total then coalesce(paid_date, current_date)
                    else paid_date
                  end
  where id = p_invoice_id
  returning * into invoice_row;

  return invoice_row;
end;
$$;

grant execute on function public.record_invoice_payment(uuid, numeric) to authenticated;

-- ============================================================
-- 2. Fix create_invoice_from_booking for partial deposit credit
-- ============================================================

create or replace function public.create_invoice_from_booking(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row          public.bookings;
  invoice_id_value     uuid;
  due_date_value       date;
  invoice_number_value text;
  hire_subtotal_value  numeric;
  extras_subtotal_value numeric;
  subtotal_value       numeric;
  total_value          numeric;
  prior_paid           numeric;
  invoice_status       text;
  invoice_paid_date    date;
begin
  select *
  into booking_row
  from public.bookings b
  where b.id = p_booking_id;

  if booking_row.id is null then
    raise exception 'Booking not found';
  end if;

  invoice_number_value := public.generate_document_number(booking_row.company_id, 'INV');
  due_date_value := coalesce((
    select (current_date + make_interval(days => cs.payment_terms_days))::date
    from public.company_settings cs
    where cs.company_id = booking_row.company_id
  ), current_date + interval '14 days');

  hire_subtotal_value := round(coalesce(booking_row.hire_subtotal, booking_row.total_amount, booking_row.rate_amount, 0), 2);
  extras_subtotal_value := round(coalesce((
    select sum(coalesce(bci.quantity, 0) * coalesce(bci.unit_price, 0))
    from public.booking_charge_items bci
    where bci.booking_id = booking_row.id
  ), coalesce(booking_row.extras_subtotal, 0), 0), 2);
  subtotal_value := hire_subtotal_value + extras_subtotal_value;
  total_value    := round(subtotal_value * 1.10, 2);

  prior_paid := case
    when booking_row.payment_plan = 'upfront'
         and booking_row.paid_in_full_date is not null
      then total_value
    when booking_row.payment_plan = 'deposit'
      then least(coalesce(booking_row.deposit_paid_amount, 0), total_value)
    else 0
  end;

  invoice_status := case
    when prior_paid >= total_value then 'paid'
    when prior_paid > 0           then 'partially_paid'
    else 'draft'
  end;

  invoice_paid_date := case
    when prior_paid >= total_value
      then coalesce(booking_row.paid_in_full_date, booking_row.deposit_paid_date, current_date)
    else null
  end;

  insert into public.invoices (
    company_id,
    booking_id,
    customer_id,
    invoice_number,
    subtotal,
    gst,
    total,
    paid_amount,
    status,
    paid_date,
    due_date,
    notes
  )
  values (
    booking_row.company_id,
    booking_row.id,
    booking_row.customer_id,
    invoice_number_value,
    subtotal_value,
    round(subtotal_value * 0.10, 2),
    total_value,
    prior_paid,
    invoice_status,
    invoice_paid_date,
    due_date_value,
    booking_row.notes
  )
  returning id into invoice_id_value;

  insert into public.invoice_items (invoice_id, description, quantity, unit_price)
  values (
    invoice_id_value,
    'Hire charge',
    1,
    hire_subtotal_value
  );

  insert into public.invoice_items (invoice_id, description, quantity, unit_price)
  select
    invoice_id_value,
    bci.description,
    bci.quantity,
    bci.unit_price
  from public.booking_charge_items bci
  where bci.booking_id = booking_row.id;

  return invoice_id_value;
end;
$$;

grant execute on function public.create_invoice_from_booking(uuid) to authenticated;

-- ============================================================
-- 3. Backfill: fix existing invoices stuck on 'sent'/'overdue'
--    that actually have partial payments recorded
-- ============================================================

update public.invoices
set status     = 'partially_paid',
    updated_at = now()
where paid_amount > 0
  and paid_amount < total
  and status in ('sent', 'overdue');
