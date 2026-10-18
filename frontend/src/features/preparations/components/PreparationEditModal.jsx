import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useUpdatePreparation } from '../hooks/usePreparations';
import { useFlavors } from '../../flavors/hooks/useFlavors';
import { getFlavorIcon } from '../../../lib/flavorIcons';
import { getTodayLima } from '../../../lib/dates';
import { getErrorMessage, setFormErrorsFromApi } from '../../../lib/errors';
import { toast } from 'sonner';

const preparationEditSchema = z.object({
  flavorId: z.coerce.number().positive('Selecciona un sabor'),
  investmentAmount: z.coerce
    .number({ invalid_type_error: 'Ingresa un monto numérico válido' })
    .positive('El monto de inversión debe ser mayor a 0')
    .max(99999999.99, 'El monto excede el límite permitido'),
  prepDate: z
    .string()
    .min(10, 'Fecha requerida')
    .refine((date) => date <= getTodayLima(), {
      message: 'La fecha no puede ser posterior a hoy',
    }),
  description: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

export function PreparationEditModal({ isOpen, onClose, preparation = null }) {
  const updateMutation = useUpdatePreparation();
  const { data: flavors = [] } = useFlavors();
  const today = getTodayLima();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(preparationEditSchema),
    defaultValues: {
      flavorId: '',
      investmentAmount: '',
      prepDate: today,
      description: '',
    },
  });

  const watchedDesc = watch('description') || '';

  useEffect(() => {
    if (isOpen && preparation) {
      reset({
        flavorId: String(preparation.flavorId),
        investmentAmount: String(preparation.investmentAmount),
        prepDate: preparation.prepDate ? preparation.prepDate.slice(0, 10) : today,
        description: preparation.description || '',
      });
    }
  }, [isOpen, preparation, reset, today]);

  const onSubmit = async (data) => {
    if (!preparation) return;
    try {
      await updateMutation.mutateAsync({
        id: preparation.id,
        data: {
          flavorId: Number(data.flavorId),
          investmentAmount: Number(data.investmentAmount),
          prepDate: data.prepDate,
          description: data.description ? data.description.trim() : null,
        },
      });
      onClose();
    } catch (error) {
      const handled = setFormErrorsFromApi(error, setError);
      if (!handled) {
        toast.error(getErrorMessage(error));
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={updateMutation.isPending ? () => {} : onClose}
      title="Editar preparación"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Fecha */}
        <Input
          type="date"
          label="Fecha de preparación"
          id="edit-prep-date"
          max={today}
          error={errors.prepDate?.message}
          {...register('prepDate')}
        />

        {/* Sabor */}
        <Select
          label="Sabor preparado"
          id="edit-prep-flavor"
          placeholder="Selecciona el sabor..."
          error={errors.flavorId?.message}
          {...register('flavorId')}
        >
          {flavors.map((f) => (
            <option key={f.id} value={f.id}>
              {getFlavorIcon(f.icon)} {f.name}
            </option>
          ))}
        </Select>

        {/* Monto de inversión */}
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          label="Monto de inversión"
          id="edit-prep-amount"
          prefix="S/"
          placeholder="0.00"
          error={errors.investmentAmount?.message}
          {...register('investmentAmount')}
        />

        {/* Descripción */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor="edit-prep-desc"
              className="text-xs font-semibold text-slate-700"
            >
              Descripción (opcional)
            </label>
            <span className="text-[11px] text-slate-400">
              {watchedDesc.length}/255
            </span>
          </div>
          <textarea
            id="edit-prep-desc"
            rows={2}
            maxLength={255}
            className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 resize-none ${
              errors.description
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
            }`}
            placeholder="Ej. Tanda doble de maracuyá para el fin de semana"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={updateMutation.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
