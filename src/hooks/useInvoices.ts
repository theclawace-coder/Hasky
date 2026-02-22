import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import { getInvoiceById, getInvoices, recordInvoicePayment, updateInvoiceStatus, upsertInvoice } from '../services/api';
import type { Invoice, InvoiceItem } from '../types';

export function useInvoices(status?: string) {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => getInvoices(status),
    staleTime: QUERY_STALE_TIME.short,
  });

  const saveInvoiceMutation = useMutation({
    mutationFn: ({
      payload,
      items,
    }: {
      payload: Partial<Invoice>;
      items: Array<Pick<InvoiceItem, 'description' | 'quantity' | 'unit_price'>>;
    }) => upsertInvoice(payload, items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateInvoiceStatus(id, status),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['invoice', vars.id] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => recordInvoicePayment(id, amount),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['invoice', vars.id] });
    },
  });

  return {
    invoicesQuery,
    saveInvoiceMutation,
    updateStatusMutation,
    recordPaymentMutation,
  };
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id),
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.short,
  });
}
