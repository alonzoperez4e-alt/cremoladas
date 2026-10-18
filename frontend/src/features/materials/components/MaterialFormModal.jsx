import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useCreateMaterial } from '../hooks/useMaterials';
import { getErrorMessage, setFormErrorsFromApi } from '../../../lib/errors';
import { toast } from 'sonner';

const materialSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres')
    .transform((val) => val.trim()),
});

export function MaterialFormModal({ isOpen, onClose, onCreated }) {
  const createMutation = useCreateMaterial();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: '' });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      const created = await createMutation.mutateAsync(data);
      if (onCreated) {
        onCreated(created);
      }
      onClose();
    } catch (error) {
      const apiCode = error?.response?.data?.error?.code;
      if (apiCode === 'MATERIAL_NAME_EXISTS') {
        setError('name', {
          type: 'server',
          message: 'Ya existe un material activo con este nombre.',
        });
      } else {
        const handled = setFormErrorsFromApi(error, setError);
        if (!handled) {
          toast.error(getErrorMessage(error));
        }
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={createMutation.isPending ? () => {} : onClose}
      title="Nuevo material / insumo"
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre del material"
          id="new-material-name"
          placeholder="Ej. Vasos 12oz, Cañitas, Cucharas..."
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={createMutation.isPending}>
            Guardar material
          </Button>
        </div>
      </form>
    </Modal>
  );
}
