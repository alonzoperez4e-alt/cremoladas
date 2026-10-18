import React, { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Clock, Receipt } from 'lucide-react';
import { FlavorBadge } from '../../../components/ui/FlavorBadge';
import { PaymentBadge } from '../../../components/ui/PaymentBadge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatTime } from '../../../lib/format';

const INITIAL_VISIBLE_COUNT = 5;

export function SalesList({ sales = [], totals = {} }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const salesCount = totals.salesCount || sales.length || 0;
  const cupsSold = totals.cupsSold || 0;
  const totalSold = totals.totalSold || 0;
  const cashTotal = totals.byPaymentMethod?.cash || 0;
  const yapeTotal = totals.byPaymentMethod?.yape || 0;

  const visibleSales = isExpanded ? sales : sales.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = sales.length > INITIAL_VISIBLE_COUNT;

  return (
    <div className="space-y-4">
      {/* Tarjetas de Resumen del Día */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Ventas
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5 block">
            {salesCount}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Vasos
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5 block">
            {cupsSold}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Total vendido
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
            {formatCurrency(totalSold)}
          </span>
        </div>
      </div>

      {/* Tarjetas compactas por método de pago */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-2xs flex items-center justify-between gap-2">
          <PaymentBadge method="cash" size="sm" />
          <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
            {formatCurrency(cashTotal)}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-2xs flex items-center justify-between gap-2">
          <PaymentBadge method="yape" size="sm" />
          <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
            {formatCurrency(yapeTotal)}
          </span>
        </div>
      </div>

      {/* Listado de Ventas de Hoy */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Ventas de Hoy</span>
            <Receipt className="w-4 h-4 text-pink-600" />
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {sales.length} registrada(s)
          </span>
        </div>

        {sales.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Todavía no hay ventas hoy
            </p>
            <p className="text-xs text-slate-400">
              Las ventas que registres aparecerán aquí en orden cronológico.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-1">
            {visibleSales.map((sale) => (
              <div key={sale.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(sale.createdAt)}
                    </span>
                    <PaymentBadge method={sale.paymentMethod || 'cash'} size="xs" />
                  </div>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatCurrency(sale.total)}
                  </span>
                </div>

                {/* Líneas de la venta */}
                <div className="pl-2 space-y-1.5 border-l-2 border-pink-200">
                  {sale.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800 font-mono">
                          {item.quantity}×
                        </span>
                        {item.flavors?.map((flavor) => (
                          <FlavorBadge key={flavor.id} flavor={flavor} size="sm" />
                        ))}
                      </div>
                      <span className="text-slate-600 font-mono font-medium shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="pt-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="text-xs text-pink-600 hover:text-pink-700 font-bold"
                >
                  {isExpanded ? (
                    <>
                      <span>Ver menos</span>
                      <ChevronUp className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Ver todas las {sales.length} ventas</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
