import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesDaysApi } from '../../../api/salesDays.api';
import { toast } from 'sonner';

export const SALES_DAY_TODAY_QUERY_KEY = ['sales-day-today'];
export const SALES_TODAY_QUERY_KEY = ['sales-today'];

/**
 * Hook para consultar el estado de la jornada de hoy (America/Lima)
 */
export function useSalesDayToday(options = {}) {
  const { refetchInterval = 60000, enabled = true } = options;

  return useQuery({
    queryKey: SALES_DAY_TODAY_QUERY_KEY,
    queryFn: () => salesDaysApi.getToday(),
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled,
  });
}

/**
 * Hook para obtener el detalle de ventas y desglose por sabor de hoy
 */
export function useTodaySales(options = {}) {
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: SALES_TODAY_QUERY_KEY,
    queryFn: () => salesDaysApi.getTodaySales(),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para iniciar la jornada de ventas de hoy
 */
export function useStartSalesDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => salesDaysApi.startToday(),
    onSuccess: (data) => {
      queryClient.setQueryData(SALES_DAY_TODAY_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: SALES_DAY_TODAY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SALES_TODAY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('¡Jornada de venta iniciada con éxito!');
    },
  });
}

/**
 * Hook para cerrar la jornada de ventas de hoy
 */
export function useCloseSalesDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => salesDaysApi.closeToday(),
    onSuccess: (data) => {
      queryClient.setQueryData(SALES_DAY_TODAY_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: SALES_DAY_TODAY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SALES_TODAY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.info('Jornada de venta cerrada correctamente');
    },
  });
}
