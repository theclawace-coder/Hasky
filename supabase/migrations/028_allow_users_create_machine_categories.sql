create policy "machine_categories_authenticated_insert"
on public.machine_categories
for insert
to authenticated
with check (true);
