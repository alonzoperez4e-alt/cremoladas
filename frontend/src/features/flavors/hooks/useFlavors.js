import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flavorsApi } from '../../../api/flavors.api';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../lib/errors';

export const FLAVORS_QUERY_KEY = ['flavors'];

/**
 * Hook para listar sabores activos
 */
export function useFlavors(options = {}) {
  return useQuery({
    queryKey: [...FLAVORS_QUERY_KEY, options],
    queryFn: () => flavorsApi.getAll(options),
  });
}

/**
 * Hook para crear un nuevo sabor
 */
export function useCreateFlavor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => flavorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLAVORS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Sabor registrado exitosamente');
    },
  });
}

/**
 * Hook para actualizar un sabor
 */
export function useUpdateFlavor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => flavorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLAVORS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Sabor actualizado exitosamente');
    },
  });
}

/**
 * Hook para eliminar un sabor
 */
export function useDeleteFlavor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => flavorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLAVORS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Sabor eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Hook para alternar el estado Agotado de un sabor con actualización optimista y rollback
 */
export function useToggleSoldOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isSoldOut }) => flavorsApi.setSoldOut(id, isSoldOut),
    onMutate: async ({ id, isSoldOut }) => {
      // Cancela queries salientes para evitar sobreescritura
      await queryClient.cancelQueries({ queryKey: FLAVORS_QUERY_KEY });

      // Guarda estado previo
      const previousFlavors = queryClient.getQueryData(FLAVORS_QUERY_KEY);

      // Aplica actualización optimista si existe en caché
      queryClient.setQueriesData({ queryKey: FLAVORS_QUERY_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((flavor) =>
          flavor.id === id ? { ...flavor, isSoldOut } : flavor
        );
      });

      return { previousFlavors };
    },
    onError: (err, variables, context) => {
      // Revertir a estado previo si falló
      if (context?.previousFlavors) {
        queryClient.setQueryData(FLAVORS_QUERY_KEY, context.previousFlavors);
      }
      toast.error(getErrorMessage(err));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FLAVORS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
