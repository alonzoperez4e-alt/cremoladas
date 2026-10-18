import React from 'react';
import { PieChart, Info } from 'lucide-react';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import { formatCurrency } from '../../../lib/format';

export function FlavorBreakdown({ byFlavor = [] }) {
  if (!byFlavor || byFlavor.length === 0) {
    return null;
  }

  // Ordenar de mayor a menor vasos vendidos
  const sorted = [...byFlavor].sort((a, b) => b.cups - a.cups);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
          <span>Ventas por Sabor</span>
          <PieChart className="w-4 h-4 text-pink-600" />
        </h3>
        <span className="text-xs font-bold text-slate-400">
          {byFlavor.length} sabor(es) con ventas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((item) => (
          <div
            key={item.flavorId}
            className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex items-center gap-2.5">
              <FlavorBadge
                flavor={{
                  name: item.flavorName,
                  color: item.color,
                  icon: item.icon,
                }}
                showName={false}
                size="md"
              />
              <div className="min-w-0">
                <span className="text-sm font-bold text-slate-800 truncate block">
                  {item.flavorName}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {item.cups} {item.cups === 1 ? 'vaso' : 'vasos'}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-black text-slate-900 font-mono block">
                {formatCurrency(item.attributedRevenue)}
              </span>
              <span className="text-[10px] text-slate-400">ingreso atribuido</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-400 leading-relaxed">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          En los vasos surtidos con múltiples sabores, el monto se reparte en partes
          iguales entre sus sabores integrantes.
        </span>
      </div>
    </div>
  );
}
