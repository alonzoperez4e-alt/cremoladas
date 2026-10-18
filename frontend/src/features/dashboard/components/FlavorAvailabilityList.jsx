import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFlavors, useToggleSoldOut } from '../../flavors/hooks/useFlavors';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { getErrorMessage } from '../../../lib/errors';
import { toast } from 'sonner';

export function FlavorAvailabilityList() {
  const { data: flavors = [], isLoading, isError, error, refetch } = useFlavors();
  const toggleMutation = useToggleSoldOut();
  const [loadingFlavorId, setLoadingFlavorId] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Error al cargar sabores"
        message={getErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  if (flavors.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No hay sabores registrados"
        description="Añade sabores en el catálogo para controlar su disponibilidad y venderlos."
        actionLabel="Ir a Sabores"
        onAction={() => {}}
      />
    );
  }

  const availableCount = flavors.filter((f) => !f.isSoldOut).length;
  const soldOutCount = flavors.filter((f) => f.isSoldOut).length;

  const handleToggle = async (flavor) => {
    const nextSoldOut = !flavor.isSoldOut;
    setLoadingFlavorId(flavor.id);
    try {
      await toggleMutation.mutateAsync({
        id: flavor.id,
        isSoldOut: nextSoldOut,
      });
      toast.success(
        nextSoldOut
          ? `"${flavor.name}" marcado como Agotado`
          : `"${flavor.name}" disponible para la venta`
      );
    } catch {
      // Reversión y toast de error controlados por useToggleSoldOut
    } finally {
      setLoadingFlavorId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-2xs space-y-5">
      {/* Encabezado con contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Disponibilidad de Sabores</span>
            <span className="text-xl">🍧</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Activa el interruptor cuando un sabor se termine en el local
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            {availableCount} disponible(s)
          </span>
          {soldOutCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
              {soldOutCount} agotado(s)
            </span>
          )}
        </div>
      </div>

      {/* Lista de Sabores con Switch */}
      <div className="divide-y divide-slate-100">
        {flavors.map((flavor) => {
          const isTogglingThis = loadingFlavorId === flavor.id;
          const isSoldOut = Boolean(flavor.isSoldOut);

          return (
            <div
              key={flavor.id}
              className={`py-3.5 sm:py-4 flex items-center justify-between gap-4 transition-all ${
                isSoldOut ? 'opacity-60 bg-slate-50/50 rounded-2xl px-3 my-1' : ''
              }`}
            >
              {/* Información del Sabor */}
              <div className="flex items-center gap-3 min-w-0">
                <FlavorBadge flavor={flavor} showName={false} size="md" />
                <div className="min-w-0">
                  <span className="text-sm sm:text-base font-bold text-slate-800 truncate block">
                    {flavor.name}
                  </span>
                  {isSoldOut ? (
                    <span className="inline-block text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-0.5">
                      Agotado para venta
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">
                      Disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Interruptor (Switch) Accesible */}
              <div className="flex items-center gap-3 shrink-0">
                <label
                  htmlFor={`flavor-toggle-${flavor.id}`}
                  className="text-xs font-semibold text-slate-600 cursor-pointer select-none hidden sm:inline"
                >
                  {isSoldOut ? 'Agotado' : 'Disponible'}
                </label>

                <button
                  id={`flavor-toggle-${flavor.id}`}
                  type="button"
                  role="switch"
                  aria-checked={isSoldOut}
                  aria-label={`Marcar sabor ${flavor.name} como ${isSoldOut ? 'disponible' : 'agotado'}`}
                  disabled={isTogglingThis}
                  onClick={() => handleToggle(flavor)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${
                    isSoldOut ? 'bg-rose-500' : 'bg-slate-300 hover:bg-slate-400'
                  } ${isTogglingThis ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="sr-only">
                    {isSoldOut ? `Sabor ${flavor.name} agotado` : `Sabor ${flavor.name} disponible`}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-xs ${
                      isSoldOut ? 'translate-x-6 text-rose-600 font-bold' : 'translate-x-0 text-slate-400'
                    }`}
                  >
                    {isSoldOut ? '✕' : '✓'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlace al catálogo completo */}
      <div className="pt-2 flex justify-end">
        <Link
          to="/sabores"
          className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 transition-colors"
        >
          <span>Administrar catálogo de sabores</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
