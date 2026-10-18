import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../../api/stats.api';

export const STATS_QUERY_KEY = ['stats'];

export function useStatsSummary() {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: () => statsApi.getSummary(),
    refetchOnWindowFocus: true,
  });
}
