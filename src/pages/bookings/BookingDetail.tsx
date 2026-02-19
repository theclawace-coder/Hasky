import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useBooking, useBookings } from '../../hooks/useBookings';
import { BookingStatusBar } from '../../components/bookings/BookingStatusBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bookingQuery = useBooking(id ?? '');
  const { updateLifecycleMutation, generateInvoiceMutation } = useBookings();

  const booking = bookingQuery.data;

  if (!booking && !bookingQuery.isLoading) {
    return <Card><p className="text-sm text-slate-600">Booking not found.</p></Card>;
  }

  const handleStatusChange = async (bookingStatus: string, machineStatus: string) => {
    if (!id) {
      return;
    }
    try {
      await updateLifecycleMutation.mutateAsync({ bookingId: id, bookingStatus, machineStatus });
      toast.success('Booking updated');
      bookingQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update booking');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!id) {
      return;
    }
    try {
      const invoiceId = await generateInvoiceMutation.mutateAsync(id);
      toast.success('Draft invoice created');
      navigate(`/invoices/${invoiceId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoice');
    }
  };

  if (bookingQuery.isLoading || !booking) {
    return <p className="text-sm text-slate-500">Loading booking...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">Booking #{booking.id.slice(0, 8)}</h2>
          <StatusBadge status={booking.status} />
        </div>
        <div className="mt-4">
          <BookingStatusBar status={booking.status} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Machine & Customer</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p><span className="font-medium">Machine:</span> {booking.machines?.name}</p>
            <p><span className="font-medium">Customer:</span> {booking.customers?.name}</p>
            <p><span className="font-medium">Start:</span> {formatDate(booking.start_date)}</p>
            <p><span className="font-medium">End:</span> {formatDate(booking.end_date)}</p>
            <p><span className="font-medium">Rate:</span> {formatCurrency(booking.rate_amount)} ({booking.rate_type})</p>
            <p><span className="font-medium">Total:</span> {formatCurrency(Number(booking.total_amount ?? booking.rate_amount))}</p>
            <p><span className="font-medium">Notes:</span> {booking.notes ?? '-'}</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {booking.status === 'quote' ? (
              <>
                <Button onClick={() => handleStatusChange('confirmed', booking.machines?.status ?? 'available')}>
                  Confirm Booking
                </Button>
                <Button variant="danger" onClick={() => handleStatusChange('cancelled', 'available')}>
                  Cancel
                </Button>
              </>
            ) : null}

            {booking.status === 'confirmed' ? (
              <Button onClick={() => handleStatusChange('active', 'on_hire')}>Start Hire</Button>
            ) : null}

            {booking.status === 'active' ? (
              <Button variant="success" onClick={() => handleStatusChange('completed', 'available')}>
                Complete Hire
              </Button>
            ) : null}

            <Button variant="secondary" onClick={handleGenerateInvoice} loading={generateInvoiceMutation.isPending}>
              Generate Invoice
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
