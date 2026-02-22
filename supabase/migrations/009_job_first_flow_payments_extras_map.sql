-- Phase 1-3 foundation:
-- - Job-first lifecycle (drop booking "active")
-- - Payment plan + deposit tracking on bookings
-- - Structured booking extras
-- - Geolocation fields for machine base + job delivery
-- - Invoice generation from booking + extras

-- Normalize legacy booking rows before tightening constraints.
update public.bookings
set status = 'confirmed'
where status = 'active';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_status_check'
  ) then
    alter table public.bookings drop constraint bookings_status_check;
  end if;

  alter table public.bookings
    add constraint bookings_status_check
    check (status in ('quote', 'confirmed', 'completed', 'cancelled'));
exception
  when duplicate_object then
    null;
end;
$$;

alter table public.bookings
  add column if not exists hire_subtotal numeric,
  add column if not exists extras_subtotal numeric not null default 0,
  add column if not exists payment_plan text not null default 'on_completion',
  add column if not exists deposit_type text,
  add column if not exists deposit_value numeric,
  add column if not exists deposit_amount numeric not null default 0,
  add column if not exists deposit_paid_amount numeric not null default 0,
  add column if not exists deposit_paid_date date,
  add column if not exists paid_in_full_date date,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;

update public.bookings
set
  hire_subtotal = coalesce(hire_subtotal, total_amount, rate_amount),
  extras_subtotal = coalesce(extras_subtotal, 0),
  payment_plan = coalesce(payment_plan, 'on_completion'),
  deposit_amount = coalesce(deposit_amount, 0),
  deposit_paid_amount = coalesce(deposit_paid_amount, 0)
where true;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_payment_plan_check'
  ) then
    alter table public.bookings drop constraint bookings_payment_plan_check;
  end if;

  alter table public.bookings
    add constraint bookings_payment_plan_check
    check (payment_plan in ('deposit', 'upfront', 'on_completion'));
exception
  when duplicate_object then
    null;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_deposit_type_check'
  ) then
    alter table public.bookings drop constraint bookings_deposit_type_check;
  end if;

  alter table public.bookings
    add constraint bookings_deposit_type_check
    check (deposit_type in ('fixed', 'percent') or deposit_type is null);
exception
  when duplicate_object then
    null;
end;
$$;

alter table public.machines
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

create table if not exists public.booking_charge_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_charge_items_booking_id
  on public.booking_charge_items(booking_id);

alter table public.booking_charge_items enable row level security;

drop policy if exists "booking_charge_items_company_crud" on public.booking_charge_items;
create policy "booking_charge_items_company_crud"
on public.booking_charge_items
for all
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.company_id = public.current_company_id() or public.is_platform_admin())
  )
)
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and b.company_id = public.current_company_id()
  )
);

grant select, insert, update, delete on public.booking_charge_items to authenticated;

alter table public.company_settings
  add column if not exists default_booking_charges jsonb not null default '[]'::jsonb;

create or replace function public.mark_booking_deposit_paid(
  p_booking_id uuid,
  p_amount numeric default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.bookings;
  next_paid_amount numeric;
begin
  select *
  into booking_row
  from public.bookings b
  where b.id = p_booking_id;

  if booking_row.id is null then
    raise exception 'Booking not found';
  end if;

  if not (booking_row.company_id = public.current_company_id() or public.is_platform_admin()) then
    raise exception 'Access denied';
  end if;

  next_paid_amount := coalesce(p_amount, booking_row.deposit_amount, 0);
  next_paid_amount := greatest(next_paid_amount, booking_row.deposit_paid_amount);

  update public.bookings
  set
    deposit_paid_amount = next_paid_amount,
    deposit_paid_date = case
      when next_paid_amount >= coalesce(deposit_amount, 0) and next_paid_amount > 0 then current_date
      else deposit_paid_date
    end
  where id = p_booking_id
  returning * into booking_row;

  return booking_row;
end;
$$;

grant execute on function public.mark_booking_deposit_paid(uuid, numeric) to authenticated;

create or replace function public.mark_booking_paid_in_full(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.bookings;
begin
  select *
  into booking_row
  from public.bookings b
  where b.id = p_booking_id;

  if booking_row.id is null then
    raise exception 'Booking not found';
  end if;

  if not (booking_row.company_id = public.current_company_id() or public.is_platform_admin()) then
    raise exception 'Access denied';
  end if;

  update public.bookings
  set
    paid_in_full_date = current_date,
    deposit_paid_amount = greatest(coalesce(deposit_paid_amount, 0), coalesce(deposit_amount, 0)),
    deposit_paid_date = case
      when coalesce(deposit_amount, 0) > 0 then coalesce(deposit_paid_date, current_date)
      else deposit_paid_date
    end
  where id = p_booking_id
  returning * into booking_row;

  return booking_row;
end;
$$;

grant execute on function public.mark_booking_paid_in_full(uuid) to authenticated;

create or replace function public.set_booking_and_machine_status(
  p_booking_id uuid,
  p_booking_status text,
  p_machine_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.bookings;
  allowed boolean := false;
  next_machine_status text;
begin
  select *
  into booking_row
  from public.bookings b
  where b.id = p_booking_id;

  if booking_row.id is null then
    raise exception 'Booking not found';
  end if;

  if not (booking_row.company_id = public.current_company_id() or public.is_platform_admin()) then
    raise exception 'Access denied';
  end if;

  if p_booking_status not in ('quote', 'confirmed', 'completed', 'cancelled') then
    raise exception 'Invalid target booking status';
  end if;

  if booking_row.status = p_booking_status then
    return;
  end if;

  if booking_row.status = 'quote' and p_booking_status in ('confirmed', 'cancelled') then
    allowed := true;
  elsif booking_row.status = 'confirmed' and p_booking_status in ('completed', 'cancelled') then
    allowed := true;
  end if;

  if not allowed then
    raise exception 'Invalid status transition from % to %', booking_row.status, p_booking_status;
  end if;

  if p_booking_status = 'confirmed' then
    if booking_row.payment_plan = 'upfront' and booking_row.paid_in_full_date is null then
      raise exception 'Full upfront payment must be recorded before confirming this job';
    end if;

    if booking_row.payment_plan = 'deposit'
      and coalesce(booking_row.deposit_amount, 0) > 0
      and coalesce(booking_row.deposit_paid_amount, 0) < coalesce(booking_row.deposit_amount, 0)
    then
      raise exception 'Deposit must be recorded before confirming this job';
    end if;
  end if;

  update public.bookings
  set status = p_booking_status
  where id = p_booking_id;

  if p_booking_status = 'confirmed' then
    next_machine_status := 'on_hire';
  elsif p_booking_status in ('completed', 'cancelled') then
    next_machine_status := 'available';
  else
    next_machine_status := p_machine_status;
  end if;

  update public.machines
  set status = next_machine_status
  where id = booking_row.machine_id;
end;
$$;

grant execute on function public.set_booking_and_machine_status(uuid, text, text) to authenticated;

create or replace function public.create_invoice_from_booking(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.bookings;
  invoice_id_value uuid;
  due_date_value date;
  invoice_number_value text;
  hire_subtotal_value numeric;
  extras_subtotal_value numeric;
  subtotal_value numeric;
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

  insert into public.invoices (
    company_id,
    booking_id,
    customer_id,
    invoice_number,
    subtotal,
    gst,
    total,
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
    round(subtotal_value * 1.10, 2),
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

create or replace function public.convert_quote_to_booking(p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_row public.quotes;
  booking_id_value uuid;
  rate numeric;
begin
  select *
  into quote_row
  from public.quotes q
  where q.id = p_quote_id;

  if quote_row.id is null then
    raise exception 'Quote not found';
  end if;

  if quote_row.machine_id is null then
    raise exception 'Quote machine is required for conversion';
  end if;

  rate := coalesce(quote_row.total, 0);

  insert into public.bookings (
    company_id,
    machine_id,
    customer_id,
    quote_id,
    status,
    start_date,
    end_date,
    rate_type,
    rate_amount,
    hire_subtotal,
    extras_subtotal,
    total_amount,
    payment_plan,
    paid_in_full_date
  )
  values (
    quote_row.company_id,
    quote_row.machine_id,
    quote_row.customer_id,
    quote_row.id,
    'confirmed',
    quote_row.issue_date,
    quote_row.expiry_date,
    'daily',
    rate,
    rate,
    0,
    rate,
    case when quote_row.status = 'paid' then 'upfront' else 'on_completion' end,
    case when quote_row.status = 'paid' then quote_row.paid_date else null end
  )
  returning id into booking_id_value;

  update public.quotes
  set status = case when status = 'paid' then 'paid' else 'accepted' end
  where id = p_quote_id;

  update public.machines
  set status = 'on_hire'
  where id = quote_row.machine_id;

  return booking_id_value;
end;
$$;

create or replace function public.search_available_machines(
  p_category_id uuid default null,
  p_location text default null,
  p_company_id uuid default null,
  p_search text default null,
  p_start_date date default null,
  p_end_date date default null
)
returns setof public.machines
language sql
stable
security definer
set search_path = public
as $$
  select m.*
  from public.machines m
  where
    m.status = 'available'
    and m.cross_hire_available = true
    and (p_category_id is null or m.category_id = p_category_id)
    and (p_company_id is null or m.company_id = p_company_id)
    and (p_location is null or lower(coalesce(m.location, '')) like '%' || lower(p_location) || '%')
    and (
      p_search is null
      or lower(coalesce(m.name, '')) like '%' || lower(p_search) || '%'
      or lower(coalesce(m.make, '')) like '%' || lower(p_search) || '%'
      or lower(coalesce(m.model, '')) like '%' || lower(p_search) || '%'
    )
    and (
      p_start_date is null
      or p_end_date is null
      or not exists (
        select 1
        from public.bookings b
        where b.machine_id = m.id
          and b.status in ('confirmed')
          and b.start_date <= p_end_date
          and coalesce(b.end_date, b.start_date) >= p_start_date
      )
    );
$$;
