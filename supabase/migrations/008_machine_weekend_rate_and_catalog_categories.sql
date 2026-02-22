alter table if exists public.machines
  add column if not exists weekend_rate numeric;

insert into public.machine_categories (name)
select source.name
from (
  select min(trim(machine_type)) as name
  from public.machine_model_catalog
  where nullif(trim(machine_type), '') is not null
  group by lower(trim(machine_type))
) as source
on conflict (name) do nothing;
