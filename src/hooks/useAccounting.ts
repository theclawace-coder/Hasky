import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteExpense,
  getAccountingSummary,
  getExpenses,
  getMachineExpenses,
  getMachineProfitability,
  upsertExpense,
} from '../services/api';
import type { Expense } from '../types';

export function useExpenses(filters?: {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  bookingId?: string;
}) {
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => getExpenses(filters),
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: Partial<Expense>) => upsertExpense(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['accounting_summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['accounting_summary'] });
    },
  });

  return { expensesQuery, upsertMutation, deleteMutation };
}

export function useAccountingSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['accounting_summary', dateFrom, dateTo],
    queryFn: () => getAccountingSummary(dateFrom, dateTo),
  });
}

export function useMachineProfitability(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['machine_profitability', dateFrom, dateTo],
    queryFn: () => getMachineProfitability(dateFrom, dateTo),
  });
}

export function useMachineExpenses(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['machine_expenses', dateFrom, dateTo],
    queryFn: () => getMachineExpenses(dateFrom, dateTo),
  });
}
