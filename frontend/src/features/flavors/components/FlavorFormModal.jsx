import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import {
  FLAVOR_ICONS,
  PRESET_FLAVOR_COLORS,
  DEFAULT_FLAVOR_ICON,
} from '../../../lib/flavorIcons';
import { useCreateFlavor, useUpdateFlavor } from '../hooks/useFlavors';
import { getErrorMessage, setFormErrorsFromApi } from '../../../lib/errors';
import { toast } from 'sonner';

const flavorSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres')
    .transform((val) => val.trim()),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un hexadecimal válido (#RRGGBB)')
    .transform((val) => val.toUpperCase()),
  icon: z
    .string()
    .min(1, 'Selecciona un icono')
    .max(50, 'Icono demasiado largo')
    .regex(/^[a-z0-9-]+$/, 'El icono solo puede contener minúsculas, números y guiones'),
});

export function FlavorFormModal({ isOpen, onClose, initialData = null }) {
  const isEditing = Boolean(initialData?.id);
  const createMutation = useCreateFlavor();
  const updateMutation = useUpdateFlavor();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(flavorSchema),
    defaultValues: {
      name: '',
      color: '#EC4899',
      icon: 'strawberry',
    },
  });

  // Observar valores para vista previa en vivo
  const watchedName = watch('name');
  const watchedColor = watch('color');
  const watchedIcon = watch('icon');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name || '',
          color: (initialData.color || '#EC4899').toUpperCase(),
          icon: initialData.icon || 'strawberry',
        });
      } else {
        reset({
          name: '',
          color: '#EC4899',
          icon: 'strawberry',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      const apiCode = error?.response?.data?.error?.code;
      if (apiCode === 'FLAVOR_NAME_EXISTS') {
        setError('name', {
          type: 'server',
          message: 'Ya existe un sabor activo con este nombre.',
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
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? 'Editar sabor' : 'Nuevo sabor'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Vista previa en vivo */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Vista previa en vivo
          </span>
          <div className="py-2">
            <FlavorBadge
              flavor={{
                name: watchedName || 'Nombre del sabor',
                color: watchedColor || '#EC4899',
                icon: watchedIcon || DEFAULT_FLAVOR_ICON,
              }}
              size="lg"
            />
          </div>
        </div>

        {/* Campo Nombre */}
        <Input
          label="Nombre del sabor"
          id="flavor-name"
          placeholder="Ej. Fresa, Maracuyá, Lúcuma..."
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Selector de Color */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 tracking-wide">
            Color representativo
          </label>

          {/* Paleta predefinida */}
          <div className="grid grid-cols-7 gap-2">
            {PRESET_FLAVOR_COLORS.map((item) => {
              const isSelected = watchedColor?.toUpperCase() === item.hex.toUpperCase();
              return (
                <button
                  key={item.hex}
                  type="button"
                  title={item.name}
                  onClick={() => setValue('color', item.hex, { shouldValidate: true })}
                  style={{ backgroundColor: item.hex }}
                  className={`w-9 h-9 rounded-xl transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'ring-3 ring-pink-500 ring-offset-2 scale-110'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                />
              );
            })}
          </div>

          {/* Input de color libre */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1">
              <label
                htmlFor="custom-color-picker"
                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs"
                style={{ backgroundColor: watchedColor || '#EC4899' }}
              >
                <input
                  id="custom-color-picker"
                  type="color"
                  value={watchedColor || '#EC4899'}
                  onChange={(e) =>
                    setValue('color', e.target.value.toUpperCase(), {
                      shouldValidate: true,
                    })
                  }
                  className="opacity-0 w-full h-full cursor-pointer"
                />
              </label>
              <div className="text-xs text-slate-500 font-mono">
                {watchedColor?.toUpperCase() || '#EC4899'}
              </div>
            </div>
            <span className="text-xs text-slate-400">
              O elige un color libre con el selector
            </span>
          </div>

          {errors.color && (
            <p className="text-xs font-medium text-rose-600 mt-0.5">
              {errors.color.message}
            </p>
          )}
        </div>

        {/* Selector de Icono */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 tracking-wide">
            Icono del sabor
          </label>

          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-44 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-100">
            {FLAVOR_ICONS.map((item) => {
              const isSelected = watchedIcon === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  onClick={() => setValue('icon', item.key, { shouldValidate: true })}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500 scale-105 shadow-xs'
                      : 'bg-white hover:bg-slate-100 active:scale-95'
                  }`}
                >
                  {item.emoji}
                </button>
              );
            })}
          </div>

          {errors.icon && (
            <p className="text-xs font-medium text-rose-600 mt-0.5">
              {errors.icon.message}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear sabor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
