-- Atomic booking + machine lifecycle transitions.

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
  set status = p_booking_status
  where id = p_booking_id;

  update public.machines
  set status = p_machine_status
  where id = booking_row.machine_id;
end;
$$;

grant execute on function public.set_booking_and_machine_status(uuid, text, text) to authenticated;
