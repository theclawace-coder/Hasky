create table if not exists public.company_stripe_keys (
  company_id uuid primary key references public.companies(id) on delete cascade,
  publishable_key text,
  secret_key text,
  webhook_secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_company_stripe_keys_updated_at on public.company_stripe_keys;
create trigger set_company_stripe_keys_updated_at
before update on public.company_stripe_keys
for each row execute procedure public.set_updated_at();

alter table public.company_stripe_keys enable row level security;

grant select, insert, update, delete on public.company_stripe_keys to service_role;
