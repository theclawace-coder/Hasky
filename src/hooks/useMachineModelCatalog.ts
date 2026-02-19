import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import { searchMachineModelCatalog } from '../services/api';

export function useMachineModelCatalog(search: string, limit = 12) {
  const queryText = search.trim();

  return useQuery({
    queryKey: ['machine_model_catalog', queryText, limit],
    queryFn: () => searchMachineModelCatalog(queryText, limit),
    enabled: queryText.length >= 2,
    staleTime: QUERY_STALE_TIME.short,
  });
}
