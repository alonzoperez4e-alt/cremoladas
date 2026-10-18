import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../../../api/expenses.api';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../lib/errors';

export const EXPENSES_QUERY_KEY = ['expenses'];

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, params],
    queryFn: () => expensesApi.getAll(params),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Gasto registrado exitosamente');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Gasto actualizado');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Gasto eliminado');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
