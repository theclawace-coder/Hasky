-- Auto-create company_settings row whenever a company is inserted.
-- Using SECURITY DEFINER so this runs with elevated privileges and bypasses
-- RLS (which requires an authenticated session that may not exist at signup time).

create or replace function public.create_default_company_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.company_settings (company_id)
  values (NEW.id)
  on conflict (company_id) do nothing;
  return NEW;
end;
$$;

create trigger trigger_create_company_settings
after insert on public.companies
for each row
execute function public.create_default_company_settings();
