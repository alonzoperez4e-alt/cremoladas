import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Receipt,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../hooks/useExpenses';
import { useMaterials } from '../../materials/hooks/useMaterials';
import { MaterialFormModal } from '../../materials/components/MaterialFormModal';
import { ExpenseEditModal } from '../components/ExpenseEditModal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../../../lib/format';
import { getTodayLima } from '../../../lib/dates';
import { getErrorMessage, setFormErrorsFromApi } from '../../../lib/errors';
import { useQueryClient } from '@tanstack/react-query';
import { PaymentSourceSelector } from '../../transactions/components/PaymentSourceSelector';
import { PaymentSourceBadge } from '../../../components/ui/PaymentSourceBadge';
import { toast } from 'sonner';

const expenseCreateSchema = z.object({
  materialId: z.coerce.number().positive('Selecciona un material'),
  amount: z.coerce
    .number({ invalid_type_error: 'Ingresa un monto válido' })
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

export default function ExpensesPage() {
  const today = getTodayLima();

  // Estados de filtros y paginación
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    materialId: '',
  });

  const { data: materials = [] } = useMaterials();
  const {
    data: expensesData,
    isLoading: isLoadingExpenses,
    isError,
    error,
    refetch,
  } = useExpenses({
    page,
    pageSize: 15,
    from: filters.from || undefined,
    to: filters.to || undefined,
    materialId: filters.materialId || undefined,
  });

  const createMutation = useCreateExpense();
  const deleteMutation = useDeleteExpense();

  // Modales
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Estado del selector de origen del dinero
  const [paymentState, setPaymentState] = useState({
    cashAmount: 0,
    yapeAmount: 0,
    ownAmount: 0,
    isValid: false,
    mode: '',
    errorMessage: null,
  });

  // Formulario de creación
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseCreateSchema),
    defaultValues: {
      materialId: '',
      amount: '',
      expenseDate: today,
      description: '',
    },
  });

  const watchedDesc = watch('description') || '';
  const watchedAmount = watch('amount') || 0;

  // Manejador del cambio de material para capturar la opción "Agregar nuevo material"
  const handleMaterialSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__NEW_MATERIAL__') {
      setIsNewMaterialModalOpen(true);
      // No modificamos el valor actual seleccionado hasta que se cree
      return;
    }
    setValue('materialId', val, { shouldValidate: true });
  };

  // Callback cuando se crea el nuevo material desde el modal
  const handleMaterialCreated = (newMaterial) => {
    if (newMaterial?.id) {
      setValue('materialId', String(newMaterial.id), { shouldValidate: true });
    }
  };

  // Envío del nuevo gasto
  const onSubmit = async (data) => {
    if (!paymentState.isValid) {
      toast.error(paymentState.errorMessage || 'Es obligatorio elegir el origen del dinero');
      return;
    }

    try {
      await createMutation.mutateAsync({
        materialId: Number(data.materialId),
        amount: Number(data.amount),
        expenseDate: data.expenseDate,
        description: data.description ? data.description.trim() : null,
        payment: {
          cashAmount: paymentState.cashAmount,
          yapeAmount: paymentState.yapeAmount,
          ownAmount: paymentState.ownAmount,
        },
      });

      // Limpia el formulario manteniendo la fecha
      const preservedDate = data.expenseDate || today;
      reset({
        materialId: '',
        amount: '',
        expenseDate: preservedDate,
        description: '',
      });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      const code = err.response?.data?.error?.code;
      const details = err.response?.data?.error?.details;

      if (code === 'INSUFFICIENT_BALANCE') {
        const acc = details?.account === 'cash' ? 'Efectivo' : 'Yape';
        toast.error(`Saldo insuficiente en ${acc} (disponible S/ ${Number(details?.available || 0).toFixed(2)})`);
      } else if (code === 'PAYMENT_SUM_MISMATCH') {
        toast.error('La suma de los orígenes de pago debe ser exactamente igual al monto del gasto');
      } else {
        const handled = setFormErrorsFromApi(err, setError);
        if (!handled) {
          toast.error(getErrorMessage(err));
        }
      }
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteMutation.mutateAsync(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch {
      // toast controlado por onError
    }
  };

  const clearFilters = () => {
    setFilters({ from: '', to: '', materialId: '' });
    setPage(1);
  };

  const hasActiveFilters = Boolean(filters.from || filters.to || filters.materialId);

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="pb-2 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Gastos y Compras
        </h2>
        <p className="text-sm text-slate-500">
          Registra compras de insumos, vasos, azúcar, pulpas y otros materiales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Registro Rápido (Lado Izquierdo o Arriba) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Registrar nuevo gasto
              </h3>
              <p className="text-xs text-slate-400">Rápido y adaptado a móvil</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Fecha */}
            <Input
              type="date"
              label="Fecha del gasto"
              id="expense-date"
              max={today}
              error={errors.expenseDate?.message}
              {...register('expenseDate')}
            />

            {/* Material */}
            <div className="w-full flex flex-col gap-1.5">
              <label
                htmlFor="expense-material-select"
                className="text-xs font-semibold text-slate-700 tracking-wide"
              >
                Material o insumo
              </label>
              <select
                id="expense-material-select"
                value={watch('materialId') || ''}
                onChange={handleMaterialSelectChange}
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl appearance-none transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                  errors.materialId
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
                }`}
              >
                <option value="" disabled>
                  Selecciona el material...
                </option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                <option
                  value="__NEW_MATERIAL__"
                  className="font-bold text-pink-600 bg-pink-50"
                >
                  ➕ Agregar nuevo material…
                </option>
              </select>
              {errors.materialId && (
                <p className="text-xs font-medium text-rose-600 mt-0.5">
                  {errors.materialId.message}
                </p>
              )}
            </div>

            {/* Monto */}
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              label="Monto gastado (S/)"
              id="expense-amount"
              prefix="S/"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount')}
            />

            {/* Selector de origen del dinero */}
            <PaymentSourceSelector
              amount={watchedAmount}
              value={paymentState}
              onChange={setPaymentState}
              error={paymentState.errorMessage}
            />

            {/* Descripción */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="expense-desc"
                  className="text-xs font-semibold text-slate-700"
                >
                  Descripción (opcional)
                </label>
                <span className="text-[11px] text-slate-400">
                  {watchedDesc.length}/255
                </span>
              </div>
              <textarea
                id="expense-desc"
                rows={2}
                maxLength={255}
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-pink-100 focus:border-pink-500 resize-none"
                placeholder="Ej. Compra de 500 vasos de 12 oz..."
                {...register('description')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
              disabled={!paymentState.isValid || createMutation.isPending}
              className="w-full"
            >
              Guardar gasto
            </Button>
          </form>
        </div>

        {/* Historial y Filtros (Lado Derecho o Abajo) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tarjeta de Total Destacado */}
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-pink-100 uppercase tracking-wider">
                Total de gastos en el filtro
              </p>
              <h4 className="text-2xl sm:text-3xl font-black mt-1">
                {formatCurrency(expensesData?.summary?.totalAmount || 0)}
              </h4>
              <p className="text-xs text-pink-100/90 mt-1">
                {expensesData?.pagination?.total || 0} registro(s) encontrados
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Filter className="w-4 h-4 text-pink-600" />
                <span>Filtrar historial</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Input
                type="date"
                placeholder="Desde"
                value={filters.from}
                max={today}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, from: e.target.value }));
                  setPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={filters.to}
                max={today}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, to: e.target.value }));
                  setPage(1);
                }}
              />
              <Select
                placeholder="Todos los materiales"
                value={filters.materialId}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, materialId: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">Todos los materiales</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Listado de Gastos */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            {isLoadingExpenses ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-6">
                <ErrorState
                  title="Error al cargar gastos"
                  message={getErrorMessage(error)}
                  onRetry={refetch}
                />
              </div>
            ) : !expensesData?.items || expensesData.items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Receipt}
                  title="No se encontraron gastos"
                  description={
                    hasActiveFilters
                      ? 'No hay registros que coincidan con los filtros aplicados.'
                      : 'Aún no se han registrado compras o gastos.'
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expensesData.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm sm:text-base">
                          {item.materialName || 'Material general'}
                        </span>
                        <PaymentSourceBadge payment={item.payment} />
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          {formatDate(item.expenseDate)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                      <span className="text-base sm:text-lg font-black text-rose-600 font-mono">
                        -{formatCurrency(item.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => setEditingExpense(item)}
                          aria-label="Editar gasto"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          icon={Trash2}
                          onClick={() => setExpenseToDelete(item)}
                          aria-label="Eliminar gasto"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {expensesData?.pagination && (
              <div className="p-4 bg-slate-50/50">
                <Pagination
                  page={page}
                  pageSize={expensesData.pagination.pageSize}
                  total={expensesData.pagination.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar nuevo material */}
      <MaterialFormModal
        isOpen={isNewMaterialModalOpen}
        onClose={() => setIsNewMaterialModalOpen(false)}
        onCreated={handleMaterialCreated}
      />

      {/* Modal para editar gasto */}
      <ExpenseEditModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="¿Eliminar este gasto?"
        description={`Se eliminará el registro de gasto por ${formatCurrency(
          expenseToDelete?.amount || 0
        )} en ${expenseToDelete?.materialName || 'material'}.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
