import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preparationsApi } from '../../../api/preparations.api';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../lib/errors';

export const PREPARATIONS_QUERY_KEY = ['preparations'];

export function usePreparations(params = {}) {
  return useQuery({
    queryKey: [...PREPARATIONS_QUERY_KEY, params],
    queryFn: () => preparationsApi.getAll(params),
  });
}

export function useCreatePreparation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => preparationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREPARATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Preparación registrada exitosamente');
    },
  });
}

export function useUpdatePreparation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => preparationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREPARATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Preparación actualizada');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useDeletePreparation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => preparationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREPARATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Preparación eliminada');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
