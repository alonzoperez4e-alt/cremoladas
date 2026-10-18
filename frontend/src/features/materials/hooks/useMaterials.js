import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '../../../api/materials.api';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../lib/errors';

export const MATERIALS_QUERY_KEY = ['materials'];

export function useMaterials() {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEY,
    queryFn: () => materialsApi.getAll(),
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => materialsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Material agregado exitosamente');
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => materialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Material actualizado');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => materialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Material eliminado');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
