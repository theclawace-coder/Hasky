import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { notify } from '../../lib/notify';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useCustomers } from '../../hooks/useCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { getBookings, getInvoices } from '../../services/api';
import { CustomerForm, type CustomerFormValues } from '../../components/customers/CustomerForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table, TableContainer } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency } from '../../lib/utils';

export default function CustomersList() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { customersQuery, saveCustomerMutation } = useCustomers(debouncedSearch);
  const statsQuery = useQuery({
    queryKey: ['customer_stats'],
    queryFn: async () => {
      const [bookings, invoices] = await Promise.all([getBookings(), getInvoices()]);
      return { bookings, invoices };
    },
  });

  const stats = useMemo(() => {
    const bookingRows = statsQuery.data?.bookings ?? [];
    const invoiceRows = statsQuery.data?.invoices ?? [];

    const bookingCount = new Map<string, number>();
    const revenue = new Map<string, number>();

    bookingRows.forEach((booking) => {
      bookingCount.set(booking.customer_id, (bookingCount.get(booking.customer_id) ?? 0) + 1);
    });

    invoiceRows.forEach((invoice) => {
      revenue.set(invoice.customer_id, (revenue.get(invoice.customer_id) ?? 0) + Number(invoice.total));
    });

    return { bookingCount, revenue };
  }, [statsQuery.data]);

  const onSubmit = async (values: CustomerFormValues) => {
    if (!profile?.company_id) {
      return;
    }

    try {
      await saveCustomerMutation.mutateAsync({
        ...values,
        company_id: profile.company_id,
      });
      notify.success('Customer saved');
      setOpen(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to save customer');
    }
  };

  const customers = customersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Customers</h2>
        <Button data-testid="add-customer-button" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search customer name, contact or email" />

      {!customers.length && !customersQuery.isLoading ? (
        <EmptyState
          title="No customers yet"
          description="Add a customer to start creating bookings and invoices"
          actionLabel="Add Customer"
          onAction={() => setOpen(true)}
        />
      ) : (
        <TableContainer>
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">City</th>
                <th className="p-3">Bookings</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <td className="p-3 font-medium text-blue-600">{customer.name}</td>
                  <td className="p-3">{customer.contact_name ?? '-'}</td>
                  <td className="p-3">{customer.phone ?? '-'}</td>
                  <td className="p-3">{customer.email ?? '-'}</td>
                  <td className="p-3">{customer.city ?? '-'}</td>
                  <td className="p-3">{stats.bookingCount.get(customer.id) ?? 0}</td>
                  <td className="p-3">{formatCurrency(stats.revenue.get(customer.id) ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Customer">
        <CustomerForm onSubmit={onSubmit} loading={saveCustomerMutation.isPending} />
      </Modal>
    </div>
  );
}
