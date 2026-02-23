-- Add bank_name (institution name) to company_settings
alter table public.company_settings
  add column if not exists bank_name text;
