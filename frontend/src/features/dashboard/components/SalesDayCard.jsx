import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useSalesDayToday, useStartSalesDay } from '../../sales/hooks/useSalesDays';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { formatCurrency, formatDate, formatTime } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import { toast } from 'sonner';

export function SalesDayCard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useSalesDayToday({
    refetchInterval: 60000,
  });
  const startMutation = useStartSalesDay();
  const [showConfirmStart, setShowConfirmStart] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-44 w-full rounded-3xl" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Error al consultar la jornada de ventas"
        message={getErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  const status = data?.status || 'not_started';
  const salesDay = data?.salesDay;
  const totals = data?.totals || { salesCount: 0, cupsSold: 0, totalSold: 0 };
  const dateStr = data?.date;

  const handleCardClick = () => {
    if (status === 'not_started') {
      setShowConfirmStart(true);
    } else {
      // Si está abierta o cerrada, ir directo a /venta
      navigate('/venta');
    }
  };

  const handleConfirmStart = async () => {
    try {
      await startMutation.mutateAsync();
      setShowConfirmStart(false);
      navigate('/venta');
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'DAY_ALREADY_STARTED') {
        // Si ya fue iniciada en otro dispositivo, refrescar y navegar
        setShowConfirmStart(false);
        await refetch();
        navigate('/venta');
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCardClick}
        aria-label={`Venta del día: estado ${status}`}
        className="w-full text-left rounded-3xl p-6 sm:p-7 border transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-pink-300 relative overflow-hidden group shadow-xs hover:shadow-lg active:scale-[0.99] bg-white border-slate-100 hover:border-pink-200"
      >
        {/* Fondo decorativo sutil */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-pink-50/60 pointer-events-none group-hover:scale-110 transition-transform" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-3">
            {/* Cabecera con fecha y badge de estado */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(dateStr)}
              </span>

              {status === 'not_started' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  Sin iniciar
                </span>
              )}

              {status === 'open' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Venta en curso
                </span>
              )}

              {status === 'closed' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  <Lock className="w-3.5 h-3.5" />
                  Venta cerrada
                </span>
              )}
            </div>

            {/* Título y descripción según estado */}
            <div>
              {status === 'not_started' && (
                <>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Aún no iniciaste la venta de hoy
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Toca aquí para abrir la jornada del día y comenzar a despachar vasos.
                  </p>
                </>
              )}

              {status === 'open' && (
                <>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                      {formatCurrency(totals.totalSold)}
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 uppercase">
                      Total vendido
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {totals.salesCount} venta(s) registradas · {totals.cupsSold} vaso(s) despachados
                    {salesDay?.openedAt && ` · Iniciada a las ${formatTime(salesDay.openedAt)}`}
                  </p>
                </>
              )}

              {status === 'closed' && (
                <>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-700 tracking-tight font-mono">
                      {formatCurrency(totals.totalSold)}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Total final
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {totals.salesCount} ventas · {totals.cupsSold} vasos ·{' '}
                    <span className="font-semibold text-slate-600">
                      {salesDay?.closedBy === 'manual'
                        ? 'Cerrada manualmente'
                        : 'Cerrada automáticamente a las 00:00'}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Botón o flecha de acción */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {status === 'not_started' ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-600 text-white font-bold text-sm shadow-md shadow-pink-200 group-hover:bg-pink-700 transition-colors">
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar venta</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors">
                <span>{status === 'open' ? 'Ir al panel de venta' : 'Ver detalle'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Diálogo de confirmación para iniciar venta */}
      <ConfirmDialog
        isOpen={showConfirmStart}
        onClose={() => setShowConfirmStart(false)}
        onConfirm={handleConfirmStart}
        loading={startMutation.isPending}
        title="¿Deseas iniciar la venta de hoy?"
        description="Se abrirá la jornada del día para registrar ventas y despachar vasos de cremolada."
        confirmText="Sí, iniciar"
        cancelText="Cancelar"
        variant="primary"
      />
    </>
  );
}
