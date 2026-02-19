import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import { convertQuoteToBooking, getQuotes, upsertQuote } from '../services/api';
import type { Quote, QuoteItem } from '../types';

export function useQuotes(status?: string) {
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['quotes', status],
    queryFn: () => getQuotes(status),
    staleTime: QUERY_STALE_TIME.short,
  });

  const saveQuoteMutation = useMutation({
    mutationFn: ({
      payload,
      items,
    }: {
      payload: Partial<Quote>;
      items: Array<Pick<QuoteItem, 'description' | 'quantity' | 'unit_price'>>;
    }) => upsertQuote(payload, items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (quoteId: string) => convertQuoteToBooking(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return {
    quotesQuery,
    saveQuoteMutation,
    convertMutation,
  };
}
