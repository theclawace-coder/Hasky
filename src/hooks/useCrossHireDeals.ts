import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import { getCrossHireDeals, upsertCrossHireDeal } from '../services/api';
import type { CrossHireDeal } from '../types';

export function useCrossHireDeals() {
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ['cross_hire_deals'],
    queryFn: getCrossHireDeals,
    staleTime: QUERY_STALE_TIME.short,
  });

  const saveDealMutation = useMutation({
    mutationFn: (payload: Partial<CrossHireDeal>) => upsertCrossHireDeal(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cross_hire_deals'] });
    },
  });

  return {
    dealsQuery,
    saveDealMutation,
  };
}
