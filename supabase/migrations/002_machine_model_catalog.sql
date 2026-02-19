create extension if not exists "pg_trgm";

create table if not exists public.machine_model_catalog (
  id uuid primary key default gen_random_uuid(),
  machine_type text not null,
  make text not null,
  model text not null,
  display_name text not null,
  image_url text,
  source_url text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_machine_model_catalog_machine_type
  on public.machine_model_catalog(machine_type);
create index if not exists idx_machine_model_catalog_make
  on public.machine_model_catalog(make);
create index if not exists idx_machine_model_catalog_model
  on public.machine_model_catalog(model);
create index if not exists idx_machine_model_catalog_display_name_trgm
  on public.machine_model_catalog using gin (display_name gin_trgm_ops);

create trigger set_machine_model_catalog_updated_at
before update on public.machine_model_catalog
for each row execute procedure public.set_updated_at();

alter table public.machine_model_catalog enable row level security;

create policy "machine_model_catalog_select_all"
on public.machine_model_catalog
for select
using (true);

create policy "machine_model_catalog_admin_manage"
on public.machine_model_catalog
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

grant select on public.machine_model_catalog to anon, authenticated;
