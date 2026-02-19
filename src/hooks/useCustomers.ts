import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import { getCustomerById, getCustomers, upsertCustomer } from '../services/api';

export function useCustomers(search?: string) {
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search),
    staleTime: QUERY_STALE_TIME.medium,
  });

  const saveCustomerMutation = useMutation({
    mutationFn: upsertCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return {
    customersQuery,
    saveCustomerMutation,
  };
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id),
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.medium,
  });
}
