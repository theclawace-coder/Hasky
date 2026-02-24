import { useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { LineItemsTable, type LineItemValue } from './LineItemsTable';
import type { Booking, Customer, Invoice, InvoiceStatus } from '../../types';

interface InvoiceFormProps {
  customers: Customer[];
  bookings: Booking[];
  defaultValues?: Partial<Invoice>;
  defaultItems?: LineItemValue[];
  onSubmit: (payload: Partial<Invoice>, items: LineItemValue[]) => void;
  loading?: boolean;
}

export function InvoiceForm({ customers, bookings, defaultValues, defaultItems, onSubmit, loading }: InvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(defaultValues?.invoice_number ?? '');
  const [customerId, setCustomerId] = useState(defaultValues?.customer_id ?? '');
  const [bookingId, setBookingId] = useState(defaultValues?.booking_id ?? '');
  const [issueDate, setIssueDate] = useState(defaultValues?.issue_date ?? new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(defaultValues?.due_date ?? addDays(new Date(), 14).toISOString().split('T')[0]);
  const [status, setStatus] = useState<InvoiceStatus>(defaultValues?.status ?? 'draft');
  const [notes, setNotes] = useState(defaultValues?.notes ?? '');
  const [items, setItems] = useState<LineItemValue[]>(defaultItems ?? [{ description: '', quantity: 1, unit_price: 0 }]);

  const { subtotal, gst, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const gstValue = sub * 0.1;
    return { subtotal: sub, gst: gstValue, total: sub + gstValue };
  }, [items]);

  const onBookingChange = (nextBookingId: string) => {
    setBookingId(nextBookingId);
    if (!nextBookingId) {
      return;
    }

    const booking = bookings.find((item) => item.id === nextBookingId);
    if (!booking) {
      return;
    }

    setCustomerId(booking.customer_id);

    const days = differenceInCalendarDays(parseISO(booking.end_date), parseISO(booking.start_date)) + 1;
    const dateRange = `(${format(parseISO(booking.start_date), 'dd/MM/yy')} to ${format(parseISO(booking.end_date), 'dd/MM/yy')})`;
    const dayLabel = days === 1 ? 'day' : 'days';

    const bms = booking.booking_machines ?? [];
    if (bms.length > 0) {
      setItems(
        bms.map((bm) => ({
          description: `Hire of ${bm.machines?.name ?? 'equipment'} – ${days} ${dayLabel} ${dateRange}`,
          quantity: days,
          unit_price: Number(bm.rate_amount),
        })),
      );
    } else {
      setItems([
        {
          description: `Hire of ${booking.machines?.name ?? 'equipment'} – ${days} ${dayLabel} ${dateRange}`,
          quantity: days,
          unit_price: Number(booking.rate_amount),
        },
      ]);
    }
  };

  const submit = () => {
    onSubmit(
      {
        id: defaultValues?.id,
        invoice_number: invoiceNumber,
        customer_id: customerId,
        booking_id: bookingId || null,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        gst,
        total,
        status,
        notes,
      },
      items,
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Invoice number *</label>
          <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <Select value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus)}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer *</label>
          <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Booking (optional)</label>
          <Select value={bookingId} onChange={(event) => onBookingChange(event.target.value)}>
            <option value="">Standalone invoice</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>{booking.machines?.name} - {booking.customers?.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Issue date</label>
          <DatePicker value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
          <DatePicker value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
      </div>
      <LineItemsTable items={items} onChange={setItems} />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>GST (10%): ${gst.toFixed(2)}</p>
        <p className="font-semibold">Total: ${total.toFixed(2)}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} loading={loading}>Save Invoice</Button>
      </div>
    </div>
  );
}
