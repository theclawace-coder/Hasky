-- Fix three payment flow bugs:
-- 1. record_invoice_payment: ensure the function exists (idempotent re-create in case
--    migration 010 was not applied to this database instance).
-- 2. create_invoice_from_booking: credit any deposit already paid, or mark fully paid
--    when the booking used an upfront payment plan.

-- ============================================================
-- 1. Ensure record_invoice_payment exists
-- ============================================================

alter table public.invoices
  add column if not exists paid_amount numeric not null default 0;

-- Backfill: invoices already marked paid get their full amount set.
update public.invoices
set paid_amount = total
where status = 'paid' and paid_amount = 0;

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
                    when status = 'draft'  then 'sent'
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
-- 2. Fix create_invoice_from_booking to credit prior payments
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

  -- Credit any payment already received at the booking stage.
  -- Upfront plan (full payment before confirming) → invoice is fully paid.
  -- Deposit plan → deposit paid amount is credited against the invoice total.
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
