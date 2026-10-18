import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Play,
  Lock,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  useSalesDayToday,
  useTodaySales,
  useStartSalesDay,
  useCloseSalesDay,
} from '../features/sales/hooks/useSalesDays';
import { useFlavors } from '../features/flavors/hooks/useFlavors';
import { useCreateSale } from '../features/sales/hooks/useSales';
import { useCart } from '../features/sales/hooks/useCart';
import { CupBuilder } from '../features/sales/components/CupBuilder';
import { Cart } from '../features/sales/components/Cart';
import { SalesList } from '../features/sales/components/SalesList';
import { FlavorBreakdown } from '../features/sales/components/FlavorBreakdown';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { formatDate, formatCurrency } from '../lib/format';
import { getErrorMessage } from '../lib/errors';
import { toast } from 'sonner';

export default function SalePage() {
  // Estado de la jornada de hoy
  const {
    data: todayStatus,
    isLoading: isLoadingStatus,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
  } = useSalesDayToday({ refetchInterval: 30000 });

  const status = todayStatus?.status || 'not_started';
  const salesDay = todayStatus?.salesDay;
  const isDayOpen = status === 'open';
  const isDayClosed = status === 'closed';

  // Detalle de ventas del día
  const {
    data: salesData,
    refetch: refetchSales,
  } = useTodaySales({
    enabled: isDayOpen || isDayClosed,
    refetchInterval: 30000,
  });

  // Catálogo de sabores
  const { data: flavors = [], refetch: refetchFlavors } = useFlavors({
    refetchInterval: 30000,
  });

  // Mutaciones de inicio, cierre y venta
  const startMutation = useStartSalesDay();
  const closeMutation = useCloseSalesDay();
  const createSaleMutation = useCreateSale();

  // Carrito local de la venta actual
  const {
    lines,
    totalCups,
    estimatedTotal,
    hasInvalidLines,
    addLine,
    updateQuantity,
    removeLine,
    clearCart,
    markInvalidFlavors,
    removeInvalidLines,
  } = useCart();

  // Modales de confirmación
  const [showConfirmStart, setShowConfirmStart] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Ref para evitar doble toque / doble envío inmediato
  const isSubmittingRef = useRef(false);

  // Detectar si la jornada se cerró automáticamente mientras la pantalla estaba abierta
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current === 'open' && status === 'closed') {
      toast.warning(
        'La jornada de venta se ha cerrado (automática o externamente). La pantalla ha pasado a modo solo lectura.'
      );
    }
    prevStatusRef.current = status;
  }, [status]);

  // Iniciar jornada de venta
  const handleStartDay = async () => {
    try {
      await startMutation.mutateAsync();
      setShowConfirmStart(false);
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'DAY_ALREADY_STARTED') {
        setShowConfirmStart(false);
        await refetchStatus();
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  // Cerrar jornada de venta
  const handleCloseDay = async () => {
    try {
      await closeMutation.mutateAsync();
      clearCart();
      setShowConfirmClose(false);
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'DAY_ALREADY_CLOSED') {
        setShowConfirmClose(false);
        await refetchStatus();
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  // Registrar venta
  const handleRegisterSale = async () => {
    if (lines.length === 0 || hasInvalidLines || !isDayOpen) return;

    // Bloqueo inmediato con ref contra doble toque
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmittingSale(true);

    const payload = {
      items: lines.map((line) => ({
        flavorIds: line.flavorIds,
        quantity: line.quantity,
      })),
    };

    try {
      const result = await createSaleMutation.mutateAsync(payload);
      const totalAmount = result?.total != null ? result.total : estimatedTotal;

      toast.success(`Venta registrada exitosamente: ${formatCurrency(totalAmount)}`);
      clearCart();
    } catch (err) {
      const apiError = err?.response?.data?.error;
      const code = apiError?.code;

      if (code === 'FLAVOR_SOLD_OUT') {
        await refetchFlavors();
        const details = Array.isArray(apiError.details) ? apiError.details : [];
        const soldOutIds = details.map((d) => d.id || d.flavorId).filter(Boolean);
        const soldOutNames = details.map((d) => d.name).filter(Boolean);

        markInvalidFlavors(soldOutIds, 'Sabor agotado');
        toast.error(
          soldOutNames.length > 0
            ? `Sabores agotados: ${soldOutNames.join(', ')}. La venta no se registró.`
            : 'Uno o más sabores se han agotado. La venta no se registró.'
        );
      } else if (code === 'FLAVOR_NOT_FOUND') {
        await refetchFlavors();
        const details = Array.isArray(apiError.details) ? apiError.details : [];
        const invalidIds = details.map((d) => d.flavorId || d.id).filter(Boolean);

        markInvalidFlavors(invalidIds, 'Sabor no disponible');
        toast.error('Uno o más sabores ya no están disponibles en el catálogo.');
      } else if (code === 'DAY_CLOSED') {
        await refetchStatus();
        toast.error('La jornada de ventas ya se cerró. No se pudo registrar la venta.');
      } else if (code === 'DAY_NOT_STARTED') {
        await refetchStatus();
        toast.error('No hay una jornada iniciada para hoy.');
      } else {
        // Error de red o 500: refrescar ventas de hoy antes de reintentar
        await refetchSales();
        toast.error(
          `${getErrorMessage(err)} Verifica la lista de ventas de hoy antes de reintentar.`
        );
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmittingSale(false);
    }
  };

  // Estados de carga inicial o error
  if (isLoadingStatus) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-6 h-96 rounded-3xl" />
          <Skeleton className="lg:col-span-6 h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isStatusError) {
    return (
      <ErrorState
        title="Error al consultar el estado de la venta"
        message={getErrorMessage(statusError)}
        onRetry={refetchStatus}
      />
    );
  }

  // 1. PANTALLA: JORNADA SIN INICIAR (not_started)
  if (status === 'not_started') {
    return (
      <div className="max-w-xl mx-auto py-10 sm:py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(todayStatus?.date)}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Aún no has iniciado la venta de hoy
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Abre la jornada diaria para comenzar a seleccionar sabores, armar vasos y
            registrar ventas en tiempo real.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            size="lg"
            icon={Play}
            onClick={() => setShowConfirmStart(true)}
            className="px-8 text-base shadow-lg shadow-pink-200"
          >
            Iniciar venta de hoy
          </Button>
        </div>

        <ConfirmDialog
          isOpen={showConfirmStart}
          onClose={() => setShowConfirmStart(false)}
          onConfirm={handleStartDay}
          loading={startMutation.isPending}
          title="¿Deseas iniciar la venta de hoy?"
          description="Se abrirá la jornada del día para registrar ventas y despachar vasos de cremolada."
          confirmText="Sí, iniciar"
          cancelText="Cancelar"
          variant="primary"
        />
      </div>
    );
  }

  // 2. PANTALLA PRINCIPAL DE VENTA (OPEN o CLOSED)
  return (
    <div className={`space-y-6 ${isDayOpen && lines.length > 0 ? 'pb-32 sm:pb-28' : 'pb-8'}`}>
      {/* Encabezado con estado y botón de cierre */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(todayStatus?.date)}
            </span>

            {isDayOpen && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Venta en curso
              </span>
            )}

            {isDayClosed && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" />
                Venta cerrada
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Punto de Venta — Cremoladas
          </h2>
        </div>

        {/* Botón Cerrar Venta del Día (solo jornada abierta) */}
        {isDayOpen && (
          <Button
            variant="secondary"
            size="md"
            icon={Lock}
            onClick={() => setShowConfirmClose(true)}
            className="text-xs sm:text-sm font-bold text-slate-700 hover:text-rose-600 hover:border-rose-200 self-start sm:self-center"
          >
            Cerrar venta del día
          </Button>
        )}
      </div>

      {/* Banner visible de Venta Cerrada */}
      {isDayClosed && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-100 border border-slate-200 flex items-start gap-3.5 text-slate-700">
          <div className="w-10 h-10 rounded-2xl bg-white text-slate-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Jornada de venta cerrada (Modo solo lectura)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta jornada fue{' '}
              <strong>
                {salesDay?.closedBy === 'manual'
                  ? 'cerrada manualmente'
                  : 'cerrada automáticamente a las 00:00'}
              </strong>
              . Ya no se pueden registrar nuevas ventas hoy.
            </p>
          </div>
        </div>
      )}

      {/* Grid de Contenido: En modo abierto (Constructor + Carrito), en modo cerrado solo resumen */}
      {isDayOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Constructor de Vasos */}
          <div className="lg:col-span-6 space-y-6">
            <CupBuilder
              flavors={flavors}
              onAddToCart={(flavorIds, quantity) => addLine(flavorIds, quantity)}
            />
          </div>

          {/* Columna Derecha: Carrito de la Venta Actual */}
          <div className="lg:col-span-6 space-y-6">
            <Cart
              lines={lines}
              flavors={flavors}
              onUpdateQuantity={updateQuantity}
              onRemoveLine={removeLine}
              onClearCart={clearCart}
              onRemoveInvalidLines={removeInvalidLines}
            />

            {/* Resumen del Día y Ventas debajo del carrito en escritorio */}
            <div className="space-y-6 pt-2">
              <SalesList
                sales={salesData?.sales || []}
                totals={todayStatus?.totals || salesData?.totals || {}}
              />
              <FlavorBreakdown byFlavor={salesData?.byFlavor || []} />
            </div>
          </div>
        </div>
      ) : (
        /* Modo Solo Lectura: Resumen y Ventas del día */
        <div className="space-y-6 max-w-4xl mx-auto">
          <SalesList
            sales={salesData?.sales || []}
            totals={todayStatus?.totals || salesData?.totals || {}}
          />
          <FlavorBreakdown byFlavor={salesData?.byFlavor || []} />
        </div>
      )}

      {/* BARRA FIJA INFERIOR (Sticky) para Registrar Venta */}
      {isDayOpen && lines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl p-4 sm:py-4 sm:px-6 transition-all animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Venta actual ({totalCups} {totalCups === 1 ? 'vaso' : 'vasos'})
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {formatCurrency(estimatedTotal)}
                </span>
              </div>

              {hasInvalidLines && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 sm:hidden">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Sabores agotados
                </span>
              )}
            </div>

            <div className="w-full sm:w-auto flex items-center gap-3">
              {hasInvalidLines && (
                <span className="text-xs font-bold text-rose-600 hidden sm:flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Corrige los vasos agotados
                </span>
              )}

              <Button
                variant="primary"
                size="lg"
                disabled={hasInvalidLines || isSubmittingSale}
                loading={isSubmittingSale}
                onClick={handleRegisterSale}
                icon={CheckCircle2}
                className="w-full sm:w-auto min-w-[220px] text-base font-black shadow-lg shadow-pink-300"
              >
                Registrar venta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para cerrar la jornada */}
      <ConfirmDialog
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleCloseDay}
        loading={closeMutation.isPending}
        title="¿Cerrar venta del día?"
        description={
          lines.length > 0
            ? 'Ya no podrás registrar más ventas hoy. Los vasos que tengas en la venta actual sin registrar se perderán.'
            : 'Ya no podrás registrar más ventas hoy. La jornada pasará a modo solo lectura.'
        }
        confirmText="Sí, cerrar venta"
        cancelText="Permanecer abierta"
        variant="danger"
      />
    </div>
  );
}
