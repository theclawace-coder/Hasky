-- Security hardening for auth/signup and receipts storage.

-- Restrict signup inserts to authenticated users only.
drop policy if exists "companies_insert_signup" on public.companies;
create policy "companies_insert_signup"
on public.companies
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "profiles_insert_signup" on public.profiles;
create policy "profiles_insert_signup"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and company_id is not null
  and role in ('admin', 'user', 'viewer')
  and is_platform_admin = false
);

-- Prevent users from escalating their own privileges/tenant bindings.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id then
    if new.company_id is distinct from old.company_id
      or new.role is distinct from old.role
      or new.is_platform_admin is distinct from old.is_platform_admin
      or new.is_active is distinct from old.is_active then
      raise exception 'Cannot modify protected profile fields';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;
create trigger prevent_profile_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

-- Remove anon table grants for tenant/profile records.
revoke insert, select on public.companies from anon;
revoke insert, select on public.profiles from anon;

-- Make receipts bucket private and readable only by the owning tenant/admin.
update storage.buckets
set public = false
where id = 'receipts';

drop policy if exists "storage_receipts_read" on storage.objects;
create policy "storage_receipts_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = public.current_company_id()::text
    or public.is_platform_admin()
  )
);
