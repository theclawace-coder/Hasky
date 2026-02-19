import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import {
  createInvoiceFromBooking,
  getBookingById,
  getBookings,
  upsertBooking,
  updateBookingAndMachineStatus,
} from '../services/api';

export function useBookings(filters?: { status?: string; machineId?: string; dateFrom?: string; dateTo?: string }) {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => getBookings(filters),
    staleTime: QUERY_STALE_TIME.short,
  });

  const saveBookingMutation = useMutation({
    mutationFn: upsertBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const updateLifecycleMutation = useMutation({
    mutationFn: ({
      bookingId,
      bookingStatus,
      machineStatus,
    }: {
      bookingId: string;
      bookingStatus: string;
      machineStatus: string;
    }) => updateBookingAndMachineStatus(bookingId, bookingStatus, machineStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: createInvoiceFromBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    bookingsQuery,
    saveBookingMutation,
    updateLifecycleMutation,
    generateInvoiceMutation,
  };
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.short,
  });
}
