create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abn text,
  phone text,
  email text,
  address text,
  city text,
  state text not null default 'NSW',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  phone text,
  role text not null default 'user' check (role in ('admin', 'user', 'viewer')),
  is_platform_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.company_id from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_platform_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create table if not exists public.machine_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.machine_categories(id) on delete set null,
  name text not null,
  make text,
  model text,
  year int,
  serial_number text,
  registration text,
  status text not null default 'available' check (status in ('available', 'on_hire', 'under_repair', 'in_transit', 'decommissioned')),
  hourly_rate numeric,
  daily_rate numeric,
  weekly_rate numeric,
  monthly_rate numeric,
  photo_urls text[],
  attachments_info text,
  cross_hire_available boolean not null default true,
  notes text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  abn text,
  contact_name text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cross_hire_deals (
  id uuid primary key default gen_random_uuid(),
  lead_client_name text not null,
  lead_company_name text,
  lead_contact_phone text,
  lead_contact_email text,
  machine_category_needed text,
  machine_size_needed text,
  location_needed text,
  start_date_needed date,
  end_date_needed date,
  supplier_company_id uuid references public.companies(id) on delete set null,
  machine_id uuid references public.machines(id) on delete set null,
  client_rate numeric,
  supplier_rate numeric,
  margin numeric generated always as (coalesce(client_rate, 0) - coalesce(supplier_rate, 0)) stored,
  status text not null default 'lead' check (status in ('lead', 'searching', 'quoted', 'confirmed', 'active', 'completed', 'lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  quote_id uuid,
  status text not null default 'quote' check (status in ('quote', 'confirmed', 'active', 'completed', 'cancelled')),
  start_date date not null,
  end_date date,
  rate_type text check (rate_type in ('hourly', 'daily', 'weekly', 'monthly')),
  rate_amount numeric not null,
  total_amount numeric,
  delivery_address text,
  notes text,
  is_cross_hire boolean not null default false,
  cross_hire_deal_id uuid references public.cross_hire_deals(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_number text not null,
  subtotal numeric not null,
  gst numeric not null,
  total numeric not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date not null,
  paid_date date,
  notes text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_log (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('service', 'repair', 'inspection', 'certification')),
  description text not null,
  date_performed date not null,
  next_due_date date,
  cost numeric,
  performed_by text,
  document_urls text[],
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  machine_id uuid references public.machines(id) on delete set null,
  quote_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  issue_date date not null default current_date,
  expiry_date date,
  subtotal numeric not null,
  gst numeric not null,
  total numeric not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quote_number)
);

alter table public.bookings
  add constraint bookings_quote_id_fkey
  foreign key (quote_id)
  references public.quotes(id)
  on delete set null;

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  allow_cross_hire boolean not null default true,
  payment_terms_days int not null default 14 check (payment_terms_days in (7, 14, 30)),
  bank_bsb text,
  bank_account_number text,
  bank_account_name text,
  default_invoice_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'user', 'viewer')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (company_id, email, status)
);

insert into public.machine_categories (name)
values
  ('Excavator'),
  ('Forklift'),
  ('Compressor'),
  ('Dozer'),
  ('Bobcat'),
  ('Loader'),
  ('Roller'),
  ('Crane'),
  ('Generator'),
  ('Truck'),
  ('Tipper'),
  ('Grader'),
  ('Telehandler'),
  ('Scissor Lift'),
  ('Boom Lift'),
  ('Light Tower'),
  ('Other')
on conflict (name) do nothing;

create index if not exists idx_profiles_company_id on public.profiles(company_id);

create index if not exists idx_machines_company_id on public.machines(company_id);
create index if not exists idx_machines_category_id on public.machines(category_id);
create index if not exists idx_machines_status on public.machines(status);

create index if not exists idx_customers_company_id on public.customers(company_id);

create index if not exists idx_cross_hire_deals_supplier_company_id on public.cross_hire_deals(supplier_company_id);
create index if not exists idx_cross_hire_deals_machine_id on public.cross_hire_deals(machine_id);
create index if not exists idx_cross_hire_deals_status on public.cross_hire_deals(status);
create index if not exists idx_cross_hire_deals_start_date_needed on public.cross_hire_deals(start_date_needed);
create index if not exists idx_cross_hire_deals_end_date_needed on public.cross_hire_deals(end_date_needed);

create index if not exists idx_bookings_company_id on public.bookings(company_id);
create index if not exists idx_bookings_machine_id on public.bookings(machine_id);
create index if not exists idx_bookings_customer_id on public.bookings(customer_id);
create index if not exists idx_bookings_created_by on public.bookings(created_by);
create index if not exists idx_bookings_cross_hire_deal_id on public.bookings(cross_hire_deal_id);
create index if not exists idx_bookings_quote_id on public.bookings(quote_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_start_date on public.bookings(start_date);
create index if not exists idx_bookings_end_date on public.bookings(end_date);

create index if not exists idx_invoices_company_id on public.invoices(company_id);
create index if not exists idx_invoices_booking_id on public.invoices(booking_id);
create index if not exists idx_invoices_customer_id on public.invoices(customer_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_issue_date on public.invoices(issue_date);
create index if not exists idx_invoices_due_date on public.invoices(due_date);

create index if not exists idx_maintenance_log_machine_id on public.maintenance_log(machine_id);
create index if not exists idx_maintenance_log_company_id on public.maintenance_log(company_id);
create index if not exists idx_maintenance_log_date_performed on public.maintenance_log(date_performed);

create index if not exists idx_quotes_company_id on public.quotes(company_id);
create index if not exists idx_quotes_customer_id on public.quotes(customer_id);
create index if not exists idx_quotes_machine_id on public.quotes(machine_id);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_issue_date on public.quotes(issue_date);
create index if not exists idx_quotes_expiry_date on public.quotes(expiry_date);

create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_company_settings_company_id on public.company_settings(company_id);
create index if not exists idx_team_invites_company_id on public.team_invites(company_id);
create index if not exists idx_team_invites_email on public.team_invites(email);
create index if not exists idx_team_invites_status on public.team_invites(status);

create trigger set_companies_updated_at before update on public.companies
for each row execute procedure public.set_updated_at();

create trigger set_machines_updated_at before update on public.machines
for each row execute procedure public.set_updated_at();

create trigger set_customers_updated_at before update on public.customers
for each row execute procedure public.set_updated_at();

create trigger set_bookings_updated_at before update on public.bookings
for each row execute procedure public.set_updated_at();

create trigger set_invoices_updated_at before update on public.invoices
for each row execute procedure public.set_updated_at();

create trigger set_cross_hire_deals_updated_at before update on public.cross_hire_deals
for each row execute procedure public.set_updated_at();

create trigger set_quotes_updated_at before update on public.quotes
for each row execute procedure public.set_updated_at();

create trigger set_company_settings_updated_at before update on public.company_settings
for each row execute procedure public.set_updated_at();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.machine_categories enable row level security;
alter table public.machines enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.invoices enable row level security;
alter table public.maintenance_log enable row level security;
alter table public.cross_hire_deals enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoice_items enable row level security;
alter table public.company_settings enable row level security;
alter table public.team_invites enable row level security;

create policy "companies_select_own_or_platform"
on public.companies
for select
using (id = public.current_company_id() or public.is_platform_admin());

create policy "companies_update_own"
on public.companies
for update
using (id = public.current_company_id())
with check (id = public.current_company_id());

create policy "companies_insert_signup"
on public.companies
for insert
with check (true);

create policy "profiles_select_company_or_self_or_platform"
on public.profiles
for select
using (
  id = auth.uid()
  or company_id = public.current_company_id()
  or public.is_platform_admin()
);

create policy "profiles_insert_signup"
on public.profiles
for insert
with check (true);

create policy "profiles_update_self_or_company_admin"
on public.profiles
for update
using (
  id = auth.uid()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.company_id = public.current_company_id()
        and p.role = 'admin'
    )
  )
)
with check (
  id = auth.uid()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.company_id = public.current_company_id()
        and p.role = 'admin'
    )
  )
);

create policy "machine_categories_select_all"
on public.machine_categories
for select
using (true);

create policy "machine_categories_admin_manage"
on public.machine_categories
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "machines_company_crud"
on public.machines
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "customers_company_crud"
on public.customers
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "bookings_company_crud"
on public.bookings
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "invoices_company_crud"
on public.invoices
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "maintenance_company_crud"
on public.maintenance_log
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "quotes_company_crud"
on public.quotes
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "quote_items_company_crud"
on public.quote_items
for all
using (
  exists (
    select 1 from public.quotes q
    where q.id = quote_id
      and (q.company_id = public.current_company_id() or public.is_platform_admin())
  )
)
with check (
  exists (
    select 1 from public.quotes q
    where q.id = quote_id
      and q.company_id = public.current_company_id()
  )
);

create policy "invoice_items_company_crud"
on public.invoice_items
for all
using (
  exists (
    select 1 from public.invoices i
    where i.id = invoice_id
      and (i.company_id = public.current_company_id() or public.is_platform_admin())
  )
)
with check (
  exists (
    select 1 from public.invoices i
    where i.id = invoice_id
      and i.company_id = public.current_company_id()
  )
);

create policy "company_settings_company_crud"
on public.company_settings
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

create policy "cross_hire_platform_admin_only"
on public.cross_hire_deals
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "team_invites_admin"
on public.team_invites
for all
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.company_id = public.current_company_id()
        and p.role = 'admin'
    )
  )
)
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.company_id = public.current_company_id()
        and p.role = 'admin'
    )
  )
);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant insert, select on public.companies to anon;
grant insert, select on public.profiles to anon;
grant select on public.machine_categories to anon;
grant usage, select on all sequences in schema public to anon, authenticated;

create or replace function public.generate_document_number(p_company_id uuid, p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  company_name_value text;
  initials text;
  count_value int;
begin
  select c.name into company_name_value from public.companies c where c.id = p_company_id;
  initials := coalesce((
    select string_agg(upper(left(part, 1)), '')
    from regexp_split_to_table(coalesce(company_name_value, 'HB'), '\\s+') as part
  ), 'HB');

  if p_prefix = 'INV' then
    select count(*) + 1 into count_value from public.invoices where company_id = p_company_id;
  else
    select count(*) + 1 into count_value from public.quotes where company_id = p_company_id;
  end if;

  return format('%s-%s-%s', upper(p_prefix), initials, lpad(count_value::text, 4, '0'));
end;
$$;

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
begin
  select * into booking_row from public.bookings b where b.id = p_booking_id;
  if booking_row.id is null then
    raise exception 'Booking not found';
  end if;

  invoice_number_value := public.generate_document_number(booking_row.company_id, 'INV');
  due_date_value := coalesce((
    select (current_date + make_interval(days => cs.payment_terms_days))::date
    from public.company_settings cs
    where cs.company_id = booking_row.company_id
  ), current_date + interval '14 days');

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
    coalesce(booking_row.total_amount, booking_row.rate_amount),
    round(coalesce(booking_row.total_amount, booking_row.rate_amount) * 0.10, 2),
    round(coalesce(booking_row.total_amount, booking_row.rate_amount) * 1.10, 2),
    due_date_value,
    booking_row.notes
  )
  returning id into invoice_id_value;

  insert into public.invoice_items (invoice_id, description, quantity, unit_price)
  values (
    invoice_id_value,
    'Hire charge',
    1,
    coalesce(booking_row.total_amount, booking_row.rate_amount)
  );

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
  select * into quote_row from public.quotes q where q.id = p_quote_id;
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
    total_amount
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
    rate
  )
  returning id into booking_id_value;

  update public.quotes set status = 'accepted' where id = p_quote_id;

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
          and b.status in ('confirmed', 'active')
          and b.start_date <= p_end_date
          and coalesce(b.end_date, b.start_date) >= p_start_date
      )
    );
$$;

insert into storage.buckets (id, name, public)
values
  ('machine-photos', 'machine-photos', true),
  ('company-logos', 'company-logos', true),
  ('maintenance-docs', 'maintenance-docs', false)
on conflict (id) do nothing;

create policy "storage_machine_photos_read"
on storage.objects
for select
using (bucket_id = 'machine-photos');

create policy "storage_machine_photos_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'machine-photos'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

create policy "storage_machine_photos_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'machine-photos'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
)
with check (
  bucket_id = 'machine-photos'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

create policy "storage_machine_photos_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'machine-photos'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

create policy "storage_company_logos_read"
on storage.objects
for select
using (bucket_id = 'company-logos');

create policy "storage_company_logos_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

create policy "storage_maintenance_docs_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'maintenance-docs'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

create policy "storage_maintenance_docs_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'maintenance-docs'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);
