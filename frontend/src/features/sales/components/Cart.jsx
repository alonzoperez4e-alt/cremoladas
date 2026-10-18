import React, { useState } from 'react';
import { Trash2, Plus, Minus, AlertTriangle, ShoppingCart } from 'lucide-react';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { CUP_PRICE_DISPLAY } from '../../../lib/config';
import { formatCurrency } from '../../../lib/format';

export function Cart({
  lines = [],
  flavors = [],
  onUpdateQuantity,
  onRemoveLine,
  onClearCart,
  onRemoveInvalidLines,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const flavorsMap = new Map(flavors.map((f) => [f.id, f]));
  const hasInvalidLines = lines.some((l) => Boolean(l.invalidReason));
  const totalCups = lines.reduce((acc, l) => acc + l.quantity, 0);
  const totalEstimated = totalCups * CUP_PRICE_DISPLAY;

  if (lines.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Venta actual vacía
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Selecciona sabores en el constructor y pulsa "Agregar a la venta" para armar el pedido.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-2xs space-y-5">
        {/* Cabecera del Carrito */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Vasos en la Venta</span>
              <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center">
                {lines.length}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {hasInvalidLines && (
              <Button
                variant="danger"
                size="sm"
                onClick={onRemoveInvalidLines}
                icon={AlertTriangle}
                className="text-xs"
              >
                Quitar agotados
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              icon={Trash2}
              className="text-xs text-slate-400 hover:text-rose-600"
            >
              Vaciar
            </Button>
          </div>
        </div>

        {/* Aviso de líneas con sabores agotados */}
        {hasInvalidLines && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Hay vasos con sabores agotados en tu lista</span>
            </div>
            <p>
              Debes retirar o corregir los vasos marcados en rojo antes de registrar la venta.
            </p>
          </div>
        )}

        {/* Lista de Líneas del Carrito */}
        <div
          role="region"
          aria-live="polite"
          className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1"
        >
          {lines.map((line, index) => {
            const lineFlavors = line.flavorIds
              .map((id) => flavorsMap.get(id))
              .filter(Boolean);

            const isInvalid = Boolean(line.invalidReason);
            const lineSubtotal = line.quantity * CUP_PRICE_DISPLAY;

            return (
              <div
                key={line.id || index}
                className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isInvalid ? 'bg-rose-50/70 p-3 rounded-2xl my-1 border border-rose-200' : ''
                }`}
              >
                {/* Sabores de la línea */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {lineFlavors.length > 0 ? (
                      lineFlavors.map((flavor) => (
                        <FlavorBadge key={flavor.id} flavor={flavor} size="sm" />
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Sabores no disponibles
                      </span>
                    )}
                  </div>

                  {isInvalid && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {line.invalidReason || 'Contiene sabor agotado'}
                    </p>
                  )}
                </div>

                {/* Controles de cantidad, subtotal y eliminar */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  {/* Selector de Cantidad */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      disabled={line.quantity <= 1}
                      onClick={() => onUpdateQuantity(index, line.quantity - 1)}
                      aria-label="Restar un vaso"
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-8 text-center font-mono font-bold text-xs sm:text-sm text-slate-800">
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      disabled={line.quantity >= 50}
                      onClick={() => onUpdateQuantity(index, line.quantity + 1)}
                      aria-label="Añadir un vaso"
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal estimado de la línea */}
                  <span className="text-sm sm:text-base font-black text-slate-800 font-mono w-16 text-right">
                    {formatCurrency(lineSubtotal)}
                  </span>

                  {/* Botón Eliminar Línea */}
                  <button
                    type="button"
                    onClick={() => onRemoveLine(index)}
                    aria-label="Eliminar esta combinación de vasos"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen General del Carrito */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">
              Total de vasos: <strong className="text-slate-800">{totalCups}</strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">
              Total estimado
            </span>
            <span className="text-xl sm:text-2xl font-black text-pink-600 font-mono">
              {formatCurrency(totalEstimated)}
            </span>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para vaciar el carrito */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearCart();
        }}
        title="¿Vaciar la venta actual?"
        description="Se quitarán todos los vasos añadidos al carrito actual."
        confirmText="Sí, vaciar"
        cancelText="Conservar"
        variant="danger"
      />
    </>
  );
}
