import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useCustomer, useCustomers } from '../../hooks/useCustomers';
import { getBookings, getInvoices } from '../../services/api';
import { CustomerForm, type CustomerFormValues } from '../../components/customers/CustomerForm';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [tab, setTab] = useState<'bookings' | 'invoices' | 'notes'>('bookings');
  const [open, setOpen] = useState(false);

  const customerQuery = useCustomer(id ?? '');
  const { saveCustomerMutation } = useCustomers();

  const statsQuery = useQuery({
    queryKey: ['customer_detail', id],
    queryFn: async () => {
      const [bookings, invoices] = await Promise.all([getBookings(), getInvoices()]);
      return {
        bookings: bookings.filter((booking) => booking.customer_id === id),
        invoices: invoices.filter((invoice) => invoice.customer_id === id),
      };
    },
    enabled: Boolean(id),
  });

  const customer = customerQuery.data;

  const stats = useMemo(() => {
    const bookings = statsQuery.data?.bookings ?? [];
    const invoices = statsQuery.data?.invoices ?? [];
    return {
      totalBookings: bookings.length,
      revenue: invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0),
      outstanding: invoices
        .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
        .reduce((sum, invoice) => sum + Number(invoice.total), 0),
      bookings,
      invoices,
    };
  }, [statsQuery.data]);

  const onSubmit = async (values: CustomerFormValues) => {
    if (!profile?.company_id) {
      return;
    }

    try {
      await saveCustomerMutation.mutateAsync({
        ...values,
        id,
        company_id: profile.company_id,
      });
      toast.success('Customer updated');
      setOpen(false);
      customerQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update customer');
    }
  };

  if (!customer && !customerQuery.isLoading) {
    return <Card><p className="text-sm text-slate-600">Customer not found.</p></Card>;
  }

  if (customerQuery.isLoading || !customer) {
    return <p className="text-sm text-slate-500">Loading customer...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{customer.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{customer.contact_name} • {customer.phone} • {customer.email}</p>
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)}>Edit</Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total bookings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalBookings}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(stats.revenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(stats.outstanding)}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tab === 'bookings' ? 'primary' : 'secondary'} onClick={() => setTab('bookings')}>Bookings</Button>
        <Button size="sm" variant={tab === 'invoices' ? 'primary' : 'secondary'} onClick={() => setTab('invoices')}>Invoices</Button>
        <Button size="sm" variant={tab === 'notes' ? 'primary' : 'secondary'} onClick={() => setTab('notes')}>Notes</Button>
      </div>

      {tab === 'bookings' ? (
        <Card>
          <div className="space-y-3">
            {stats.bookings.length ? stats.bookings.map((booking) => (
              <a key={booking.id} href={`/bookings/${booking.id}`} className="block rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{booking.machines?.name}</p>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-sm text-slate-600">{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</p>
              </a>
            )) : <p className="text-sm text-slate-500">No bookings for this customer.</p>}
          </div>
        </Card>
      ) : null}

      {tab === 'invoices' ? (
        <Card>
          <div className="space-y-3">
            {stats.invoices.length ? stats.invoices.map((invoice) => (
              <a key={invoice.id} href={`/invoices/${invoice.id}`} className="block rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{invoice.invoice_number}</p>
                  <StatusBadge status={invoice.status} />
                </div>
                <p className="text-sm text-slate-600">{formatCurrency(invoice.total)} • Due {formatDate(invoice.due_date)}</p>
              </a>
            )) : <p className="text-sm text-slate-500">No invoices for this customer.</p>}
          </div>
        </Card>
      ) : null}

      {tab === 'notes' ? (
        <Card>
          <p className="text-sm text-slate-700">{customer.notes || 'No notes added for this customer.'}</p>
        </Card>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Customer">
        <CustomerForm defaultValues={customer} onSubmit={onSubmit} loading={saveCustomerMutation.isPending} />
      </Modal>
    </div>
  );
}
