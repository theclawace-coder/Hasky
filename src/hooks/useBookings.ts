import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import {
  createInvoiceFromBooking,
  getBookingById,
  getBookings,
  markBookingDepositPaid,
  markBookingPaidInFull,
  upsertBooking,
  updateBookingAndMachineStatus,
} from '../services/api';
import type { Booking, BookingChargeItem } from '../types';

export function useBookings(filters?: {
  status?: string;
  machineId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateOn?: string;
  includeChargeItems?: boolean;
}) {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => getBookings(filters),
    staleTime: QUERY_STALE_TIME.short,
  });

  const saveBookingMutation = useMutation({
    mutationFn: ({
      payload,
      chargeItems,
    }: {
      payload: Partial<Booking>;
      chargeItems?: Array<Pick<BookingChargeItem, 'description' | 'quantity' | 'unit_price'>>;
    }) => upsertBooking(payload, chargeItems ?? []),
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

  const markDepositPaidMutation = useMutation({
    mutationFn: ({ bookingId, amount }: { bookingId: string; amount?: number }) =>
      markBookingDepositPaid(bookingId, amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const markPaidInFullMutation = useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) => markBookingPaidInFull(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return {
    bookingsQuery,
    saveBookingMutation,
    updateLifecycleMutation,
    generateInvoiceMutation,
    markDepositPaidMutation,
    markPaidInFullMutation,
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
