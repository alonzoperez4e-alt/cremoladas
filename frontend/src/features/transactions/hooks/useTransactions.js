import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../../../api/transactions.api';
import { withdrawalsApi } from '../../../api/withdrawals.api';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../lib/errors';

export const TRANSACTIONS_QUERY_KEY = ['transactions'];

export function useTransactions(params = {}) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () => transactionsApi.getAll(params),
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => withdrawalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Retiro registrado exitosamente');
    },
  });
}

export function useDeleteWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => withdrawalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Retiro eliminado');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
