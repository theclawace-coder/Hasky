-- Add paid_amount tracking to invoices for partial payment recording.

alter table public.invoices
  add column if not exists paid_amount numeric not null default 0;

-- Backfill: invoices already marked paid get their full amount set.
update public.invoices
set paid_amount = total
where status = 'paid' and paid_amount = 0;

-- Function to record a payment against an invoice.
-- Accumulates paid_amount; auto-transitions to 'paid' when fully covered.
create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount     numeric
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row public.invoices;
  new_paid    numeric;
begin
  select * into invoice_row
  from public.invoices
  where id = p_invoice_id;

  if invoice_row.id is null then
    raise exception 'Invoice not found';
  end if;

  if not (invoice_row.company_id = public.current_company_id() or public.is_platform_admin()) then
    raise exception 'Access denied';
  end if;

  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  new_paid := least(coalesce(invoice_row.paid_amount, 0) + p_amount, invoice_row.total);

  update public.invoices
  set
    paid_amount = new_paid,
    status      = case
                    when new_paid >= total then 'paid'
                    when status = 'draft'  then 'sent'   -- recording a payment implies it was sent
                    else status
                  end,
    paid_date   = case
                    when new_paid >= total then coalesce(paid_date, current_date)
                    else paid_date
                  end
  where id = p_invoice_id
  returning * into invoice_row;

  return invoice_row;
end;
$$;

grant execute on function public.record_invoice_payment(uuid, numeric) to authenticated;
