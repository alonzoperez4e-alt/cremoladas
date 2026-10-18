import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Plus,
  Filter,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  usePreparations,
  useCreatePreparation,
  useDeletePreparation,
} from '../hooks/usePreparations';
import { useFlavors } from '../../flavors/hooks/useFlavors';
import { PreparationEditModal } from '../components/PreparationEditModal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../../../lib/format';
import { getTodayLima } from '../../../lib/dates';
import { getFlavorIcon } from '../../../lib/flavorIcons';
import { getErrorMessage, setFormErrorsFromApi } from '../../../lib/errors';
import { toast } from 'sonner';

const prepCreateSchema = z.object({
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

export default function PreparationsPage() {
  const today = getTodayLima();

  // Estados de filtros y paginación
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    flavorId: '',
  });

  // Queries
  const { data: flavors = [], isLoading: isLoadingFlavors } = useFlavors();
  const {
    data: prepData,
    isLoading: isLoadingPreps,
    isError,
    error,
    refetch,
  } = usePreparations({
    page,
    pageSize: 15,
    from: filters.from || undefined,
    to: filters.to || undefined,
    flavorId: filters.flavorId || undefined,
  });

  const createMutation = useCreatePreparation();
  const deleteMutation = useDeletePreparation();

  // Modales
  const [editingPrep, setEditingPrep] = useState(null);
  const [prepToDelete, setPrepToDelete] = useState(null);

  // Formulario
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(prepCreateSchema),
    defaultValues: {
      flavorId: '',
      investmentAmount: '',
      prepDate: today,
      description: '',
    },
  });

  const watchedDesc = watch('description') || '';

  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync({
        flavorId: Number(data.flavorId),
        investmentAmount: Number(data.investmentAmount),
        prepDate: data.prepDate,
        description: data.description ? data.description.trim() : null,
      });

      // Limpiar manteniendo la fecha
      const preservedDate = data.prepDate || today;
      reset({
        flavorId: '',
        investmentAmount: '',
        prepDate: preservedDate,
        description: '',
      });
    } catch (err) {
      const handled = setFormErrorsFromApi(err, setError);
      if (!handled) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleDelete = async () => {
    if (!prepToDelete) return;
    try {
      await deleteMutation.mutateAsync(prepToDelete.id);
      setPrepToDelete(null);
    } catch {
      // toast controlado por onError
    }
  };

  const clearFilters = () => {
    setFilters({ from: '', to: '', flavorId: '' });
    setPage(1);
  };

  const hasActiveFilters = Boolean(filters.from || filters.to || filters.flavorId);

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="pb-2 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Preparaciones de Cremoladas
        </h2>
        <p className="text-sm text-slate-500">
          Registra las tandas y la inversión realizada en cada sabor preparado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Registro Rápido */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Registrar preparación
              </h3>
              <p className="text-xs text-slate-400">Rápido y adaptado a móvil</p>
            </div>
          </div>

          {/* Aviso si no hay sabores creados */}
          {!isLoadingFlavors && flavors.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>No hay sabores registrados</span>
              </div>
              <p className="text-xs text-amber-700">
                Para registrar una preparación necesitas al menos un sabor activo.
              </p>
              <Link
                to="/sabores"
                className="inline-block text-xs font-bold text-pink-700 underline hover:text-pink-800"
              >
                Ir a crear sabores →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Fecha */}
              <Input
                type="date"
                label="Fecha de preparación"
                id="prep-date"
                max={today}
                error={errors.prepDate?.message}
                {...register('prepDate')}
              />

              {/* Sabor */}
              <Select
                label="Sabor de la cremolada"
                id="prep-flavor-select"
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

              {/* Monto de Inversión */}
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                label="Monto de inversión (S/)"
                id="prep-investment-amount"
                prefix="S/"
                placeholder="0.00"
                error={errors.investmentAmount?.message}
                {...register('investmentAmount')}
              />

              {/* Descripción */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="prep-desc"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Descripción (opcional)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {watchedDesc.length}/255
                  </span>
                </div>
                <textarea
                  id="prep-desc"
                  rows={2}
                  maxLength={255}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-pink-100 focus:border-pink-500 resize-none"
                  placeholder="Ej. Tanda grande con fruta de temporada..."
                  {...register('description')}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={createMutation.isPending}
                className="w-full"
              >
                Guardar preparación
              </Button>
            </form>
          )}
        </div>

        {/* Historial y Filtros */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tarjeta de Total Destacado */}
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-pink-100 uppercase tracking-wider">
                Total invertido en el filtro
              </p>
              <h4 className="text-2xl sm:text-3xl font-black mt-1">
                {formatCurrency(prepData?.summary?.totalAmount || 0)}
              </h4>
              <p className="text-xs text-pink-100/90 mt-1">
                {prepData?.pagination?.total || 0} registro(s) encontrados
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <FlaskConical className="w-6 h-6" />
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
                placeholder="Todos los sabores"
                value={filters.flavorId}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, flavorId: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">Todos los sabores</option>
                {flavors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {getFlavorIcon(f.icon)} {f.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Listado de Preparaciones */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            {isLoadingPreps ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-6">
                <ErrorState
                  title="Error al cargar preparaciones"
                  message={getErrorMessage(error)}
                  onRetry={refetch}
                />
              </div>
            ) : !prepData?.items || prepData.items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={FlaskConical}
                  title="No se encontraron preparaciones"
                  description={
                    hasActiveFilters
                      ? 'No hay registros que coincidan con los filtros aplicados.'
                      : 'Aún no se han registrado preparaciones de cremoladas.'
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {prepData.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FlavorBadge
                          flavor={{
                            name: item.flavorName,
                            color: item.flavorColor,
                            icon: item.flavorIcon,
                          }}
                        />
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          {formatDate(item.prepDate)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                      <span className="text-base sm:text-lg font-black text-pink-700 font-mono">
                        {formatCurrency(item.investmentAmount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => setEditingPrep(item)}
                          aria-label="Editar preparación"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          icon={Trash2}
                          onClick={() => setPrepToDelete(item)}
                          aria-label="Eliminar preparación"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {prepData?.pagination && (
              <div className="p-4 bg-slate-50/50">
                <Pagination
                  page={page}
                  pageSize={prepData.pagination.pageSize}
                  total={prepData.pagination.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar preparación */}
      <PreparationEditModal
        isOpen={Boolean(editingPrep)}
        onClose={() => setEditingPrep(null)}
        preparation={editingPrep}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={Boolean(prepToDelete)}
        onClose={() => setPrepToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="¿Eliminar esta preparación?"
        description={`Se eliminará el registro de preparación de "${prepToDelete?.flavorName}" por ${formatCurrency(
          prepToDelete?.investmentAmount || 0
        )}.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
