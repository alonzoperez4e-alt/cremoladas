import React from 'react';
import { X } from 'lucide-react';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';

export function CupPreview({ flavors = [], onRemoveFlavor }) {
  const hasFlavors = flavors.length > 0;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-100 min-h-[190px]">
      {/* Vaso Visual */}
      <div className="relative w-28 h-36 flex flex-col items-center justify-end">
        {/* Borde superior del vaso (tapa o abertura) */}
        <div
          className={`w-28 h-4 rounded-t-lg border-2 border-b-0 transition-colors ${
            hasFlavors
              ? 'border-pink-300 bg-white/90 shadow-2xs'
              : 'border-dashed border-slate-300 bg-white/50'
          }`}
        />

        {/* Cuerpo del vaso trapezoidal */}
        <div
          className={`w-24 h-32 relative overflow-hidden transition-all flex flex-col justify-end shadow-xs ${
            hasFlavors
              ? 'border-2 border-t-0 border-pink-300 bg-white'
              : 'border-2 border-t-0 border-dashed border-slate-300 bg-white/40'
          }`}
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)',
          }}
        >
          {hasFlavors ? (
            // Franjas de sabores divididas equitativamente
            <div className="w-full h-full flex flex-col">
              {flavors.map((flavor, index) => (
                <div
                  key={`${flavor.id}_${index}`}
                  style={{
                    backgroundColor: flavor.color || '#CBD5E1',
                    height: `${100 / flavors.length}%`,
                  }}
                  className="w-full transition-all duration-300 flex items-center justify-center opacity-90 hover:opacity-100"
                  title={flavor.name}
                >
                  <span className="text-[11px] drop-shadow-xs select-none">
                    {flavor.iconEmoji || ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // Vaso vacío con guía
            <div className="w-full h-full flex items-center justify-center p-2 text-center select-none">
              <span className="text-[11px] font-semibold text-slate-400 leading-tight">
                Elige los sabores de tu vaso
              </span>
            </div>
          )}
        </div>

        {/* Base del vaso */}
        <div
          className={`w-20 h-2 rounded-b-md border-2 border-t-0 ${
            hasFlavors
              ? 'border-pink-300 bg-slate-100'
              : 'border-dashed border-slate-300 bg-transparent'
          }`}
        />
      </div>

      {/* Lista de Sabores Seleccionados con botón "x" para quitar */}
      {hasFlavors && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-full">
          {flavors.map((flavor, index) => (
            <div
              key={`${flavor.id}_${index}`}
              className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 shadow-2xs animate-in zoom-in-95 duration-150"
            >
              <FlavorBadge flavor={flavor} showName={true} size="sm" />
              <button
                type="button"
                onClick={() => onRemoveFlavor(flavor.id)}
                aria-label={`Quitar ${flavor.name} del vaso`}
                className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
