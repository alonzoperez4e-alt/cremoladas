import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../../../api/sales.api';
import { SALES_DAY_TODAY_QUERY_KEY, SALES_TODAY_QUERY_KEY } from './useSalesDays';

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => salesApi.createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_TODAY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SALES_DAY_TODAY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
