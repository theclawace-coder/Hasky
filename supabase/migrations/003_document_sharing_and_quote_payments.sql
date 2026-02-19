create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null,
  description text not null,
  amount numeric(12,2) not null,
  gst_amount numeric(12,2) not null default 0,
  date date not null,
  vendor text,
  notes text,
  receipt_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists receipt_url text;

create index if not exists idx_expenses_company_id on public.expenses(company_id);
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_expenses_category on public.expenses(category);

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute procedure public.set_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "expenses_company_crud" on public.expenses;
create policy "expenses_company_crud"
on public.expenses
for all
using (company_id = public.current_company_id() or public.is_platform_admin())
with check (company_id = public.current_company_id());

grant select, insert, update, delete on public.expenses to authenticated;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "storage_receipts_read" on storage.objects;
create policy "storage_receipts_read"
on storage.objects
for select
using (bucket_id = 'receipts');

drop policy if exists "storage_receipts_write" on storage.objects;
create policy "storage_receipts_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

drop policy if exists "storage_receipts_update" on storage.objects;
create policy "storage_receipts_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
)
with check (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

drop policy if exists "storage_receipts_delete" on storage.objects;
create policy "storage_receipts_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);

alter table public.quotes
  add column if not exists share_token text,
  add column if not exists sent_to text,
  add column if not exists sent_at timestamptz,
  add column if not exists paid_date date;

alter table public.invoices
  add column if not exists share_token text,
  add column if not exists sent_to text,
  add column if not exists sent_at timestamptz;

create unique index if not exists idx_quotes_share_token_unique
  on public.quotes(share_token)
  where share_token is not null;

create unique index if not exists idx_invoices_share_token_unique
  on public.invoices(share_token)
  where share_token is not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quotes'::regclass
      and conname = 'quotes_status_check'
  ) then
    alter table public.quotes drop constraint quotes_status_check;
  end if;

  alter table public.quotes
    add constraint quotes_status_check
    check (status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'paid'));
exception
  when duplicate_object then
    null;
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

  update public.quotes
  set status = case when status = 'paid' then 'paid' else 'accepted' end
  where id = p_quote_id;

  return booking_id_value;
end;
$$;
