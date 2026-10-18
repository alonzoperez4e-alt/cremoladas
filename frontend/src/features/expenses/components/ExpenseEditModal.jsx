import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useUpdateExpense } from '../hooks/useExpenses';
import { useMaterials } from '../../materials/hooks/useMaterials';
import { getTodayLima } from '../../../lib/dates';
import { getErrorMessage, setFormErrorsFromApi } from '../../../lib/errors';
import { toast } from 'sonner';

const expenseEditSchema = z.object({
  materialId: z.coerce.number().positive('Selecciona un material válido'),
  amount: z.coerce
    .number({ invalid_type_error: 'Ingresa un monto numérico válido' })
    .positive('El monto debe ser mayor a 0')
    .max(99999999.99, 'El monto excede el límite permitido'),
  expenseDate: z
    .string()
    .min(10, 'Fecha requerida')
    .refine((date) => date <= getTodayLima(), {
      message: 'La fecha no puede ser posterior a hoy',
    }),
  description: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

export function ExpenseEditModal({ isOpen, onClose, expense = null }) {
  const updateMutation = useUpdateExpense();
  const { data: materials = [] } = useMaterials();
  const today = getTodayLima();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseEditSchema),
    defaultValues: {
      materialId: '',
      amount: '',
      expenseDate: today,
      description: '',
    },
  });

  const watchedDesc = watch('description') || '';

  useEffect(() => {
    if (isOpen && expense) {
      reset({
        materialId: String(expense.materialId),
        amount: String(expense.amount),
        expenseDate: expense.expenseDate ? expense.expenseDate.slice(0, 10) : today,
        description: expense.description || '',
      });
    }
  }, [isOpen, expense, reset, today]);

  const onSubmit = async (data) => {
    if (!expense) return;
    try {
      await updateMutation.mutateAsync({
        id: expense.id,
        data: {
          materialId: Number(data.materialId),
          amount: Number(data.amount),
          expenseDate: data.expenseDate,
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
      title="Editar gasto"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Fecha */}
        <Input
          type="date"
          label="Fecha del gasto"
          id="edit-expense-date"
          max={today}
          error={errors.expenseDate?.message}
          {...register('expenseDate')}
        />

        {/* Material */}
        <Select
          label="Material o insumo"
          id="edit-expense-material"
          placeholder="Selecciona el material..."
          error={errors.materialId?.message}
          {...register('materialId')}
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>

        {/* Monto */}
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          label="Monto"
          id="edit-expense-amount"
          prefix="S/"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Descripción */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor="edit-expense-desc"
              className="text-xs font-semibold text-slate-700"
            >
              Descripción (opcional)
            </label>
            <span className="text-[11px] text-slate-400">
              {watchedDesc.length}/255
            </span>
          </div>
          <textarea
            id="edit-expense-desc"
            rows={2}
            maxLength={255}
            className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 resize-none ${
              errors.description
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
            }`}
            placeholder="Ej. Compra de 500 vasos para la semana"
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
