import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '../lib/constants';
import { getMachineCategories, getMachineById, getMachines, upsertMachine, updateMachineStatus } from '../services/api';

export function useMachines(filters?: { search?: string; categoryId?: string; status?: string }) {
  const queryClient = useQueryClient();

  const machinesQuery = useQuery({
    queryKey: ['machines', filters],
    queryFn: () => getMachines(filters),
    staleTime: QUERY_STALE_TIME.medium,
  });

  const categoriesQuery = useQuery({
    queryKey: ['machine_categories'],
    queryFn: getMachineCategories,
    staleTime: QUERY_STALE_TIME.long,
  });

  const saveMachineMutation = useMutation({
    mutationFn: upsertMachine,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateMachineStatus(id, status),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['machines'] });
      void queryClient.invalidateQueries({ queryKey: ['machine', vars.id] });
    },
  });

  return {
    machinesQuery,
    categoriesQuery,
    saveMachineMutation,
    updateStatusMutation,
  };
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: ['machine', id],
    queryFn: () => getMachineById(id),
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.medium,
  });
}
