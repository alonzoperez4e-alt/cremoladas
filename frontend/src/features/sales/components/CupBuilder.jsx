import React, { useState, useEffect, memo } from 'react';
import { Plus, Minus, RotateCcw, AlertCircle, ShoppingBag } from 'lucide-react';
import { CupPreview } from './CupPreview';
import { Button } from '../../../components/ui/Button';
import { getFlavorIcon } from '../../../lib/flavorIcons';
import { CUP_PRICE_DISPLAY } from '../../../lib/config';
import { formatCurrency } from '../../../lib/format';
import { toast } from 'sonner';

const MAX_FLAVORS_PER_CUP = 6;

// Chip memoizado para evitar renders innecesarios en la cuadrícula de sabores
const FlavorChip = memo(function FlavorChip({
  flavor,
  isSelected,
  isDisabled,
  onToggle,
}) {
  const iconEmoji = getFlavorIcon(flavor.icon);
  const isSoldOut = Boolean(flavor.isSoldOut);

  return (
    <button
      type="button"
      role="button"
      aria-pressed={isSelected}
      aria-disabled={isSoldOut || isDisabled}
      disabled={isSoldOut || isDisabled}
      onClick={() => onToggle(flavor)}
      className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border transition-all text-left select-none ${
        isSoldOut
          ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
          : isSelected
          ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-xs ring-2 ring-pink-400/40'
          : isDisabled
          ? 'opacity-50 bg-white border-slate-200 text-slate-400 cursor-not-allowed'
          : 'bg-white border-slate-200 hover:border-pink-300 hover:bg-pink-50/30 text-slate-700 cursor-pointer active:scale-95'
      }`}
    >
      <span
        style={{ backgroundColor: flavor.color || '#CBD5E1' }}
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 shadow-2xs"
      >
        {iconEmoji}
      </span>
      <span className="truncate flex-1">{flavor.name}</span>
      {isSoldOut && (
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm">
          Agotado
        </span>
      )}
      {isSelected && (
        <span className="w-2 h-2 rounded-full bg-pink-600 shrink-0" />
      )}
    </button>
  );
});

export function CupBuilder({ flavors = [], onAddToCart }) {
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // Sincronización con sabores agotados: si un sabor seleccionado se agota en el backend, se quita automáticamente
  useEffect(() => {
    if (selectedFlavors.length === 0 || flavors.length === 0) return;

    const currentFlavorsMap = new Map(flavors.map((f) => [f.id, f]));
    const removedFlavors = [];

    setSelectedFlavors((prev) => {
      const remaining = prev.filter((flavor) => {
        const live = currentFlavorsMap.get(flavor.id);
        const isNowSoldOut = !live || live.isSoldOut || !live.isActive;
        if (isNowSoldOut) {
          removedFlavors.push(flavor.name);
          return false;
        }
        return true;
      });
      return remaining;
    });

    if (removedFlavors.length > 0) {
      toast.warning(
        `El sabor "${removedFlavors.join(', ')}" se agotó y se quitó de tu vaso.`
      );
    }
  }, [flavors, selectedFlavors.length]);

  const handleToggleFlavor = (flavor) => {
    if (flavor.isSoldOut) return;

    setSelectedFlavors((prev) => {
      const exists = prev.some((f) => f.id === flavor.id);
      if (exists) {
        return prev.filter((f) => f.id !== flavor.id);
      }
      if (prev.length >= MAX_FLAVORS_PER_CUP) {
        toast.info(`Máximo ${MAX_FLAVORS_PER_CUP} sabores por vaso`);
        return prev;
      }
      return [
        ...prev,
        {
          id: flavor.id,
          name: flavor.name,
          color: flavor.color,
          icon: flavor.icon,
          iconEmoji: getFlavorIcon(flavor.icon),
        },
      ];
    });
  };

  const handleRemoveFlavor = (flavorId) => {
    setSelectedFlavors((prev) => prev.filter((f) => f.id !== flavorId));
  };

  const handleClearCup = () => {
    setSelectedFlavors([]);
    setQuantity(1);
  };

  const handleAdd = () => {
    if (selectedFlavors.length === 0) return;
    const flavorIds = selectedFlavors.map((f) => f.id);
    onAddToCart(flavorIds, quantity);
    toast.success(
      quantity === 1
        ? '¡Vaso agregado a la venta!'
        : `¡${quantity} vasos agregados a la venta!`
    );
    handleClearCup();
  };

  const isLimitReached = selectedFlavors.length >= MAX_FLAVORS_PER_CUP;
  const estimatedSubtotal = quantity * CUP_PRICE_DISPLAY;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-2xs space-y-6">
      {/* Cabecera del Constructor */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Constructor de Vasos</span>
            <span className="text-xl">🥤</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Elige de 1 a 6 sabores por vaso (S/ 2.00 por vaso)
          </p>
        </div>

        {selectedFlavors.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCup}
            icon={RotateCcw}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Limpiar vaso
          </Button>
        )}
      </div>

      {/* Vista Previa del Vaso */}
      <CupPreview
        flavors={selectedFlavors}
        onRemoveFlavor={handleRemoveFlavor}
      />

      {/* Cuadrícula de Selección de Sabores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>
            Sabores seleccionados: {selectedFlavors.length}/{MAX_FLAVORS_PER_CUP}
          </span>
          {isLimitReached && (
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Límite de 6 sabores alcanzado
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-50/60 rounded-2xl border border-slate-100">
          {flavors.map((flavor) => {
            const isSelected = selectedFlavors.some((f) => f.id === flavor.id);
            const isDisabled = isLimitReached && !isSelected;

            return (
              <FlavorChip
                key={flavor.id}
                flavor={flavor}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onToggle={handleToggleFlavor}
              />
            );
          })}
        </div>
      </div>

      {/* Selector de Cantidad y Estimación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Cantidad:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setQuantity(Math.min(50, Math.max(1, val)));
                }
              }}
              className="w-14 text-center font-mono font-bold text-base text-slate-800 bg-transparent focus:outline-hidden"
            />

            <button
              type="button"
              disabled={quantity >= 50}
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label="Aumentar cantidad"
              className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">
            Subtotal estimado
          </span>
          <span className="text-xl sm:text-2xl font-black text-pink-600 font-mono">
            {formatCurrency(estimatedSubtotal)}
          </span>
        </div>
      </div>

      {/* Botón Principal: Agregar a la Venta */}
      <Button
        variant="primary"
        size="lg"
        disabled={selectedFlavors.length === 0}
        onClick={handleAdd}
        icon={Plus}
        className="w-full text-base font-bold shadow-md shadow-pink-200"
      >
        {selectedFlavors.length === 0
          ? 'Elige al menos 1 sabor para armar el vaso'
          : `Agregar a la venta (${quantity} ${quantity === 1 ? 'vaso' : 'vasos'})`}
      </Button>
    </div>
  );
}
