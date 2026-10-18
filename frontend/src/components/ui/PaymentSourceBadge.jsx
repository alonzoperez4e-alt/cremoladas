import React from 'react';
import { Banknote, Smartphone, Split, Wallet } from 'lucide-react';

export function PaymentSourceBadge({ payment = null, paidCash = 0, paidYape = 0, paidOwn = 0, className = '' }) {
  const cash = Number(payment?.cashAmount ?? paidCash ?? 0);
  const yape = Number(payment?.yapeAmount ?? paidYape ?? 0);
  const own = Number(payment?.ownAmount ?? paidOwn ?? 0);

  if (cash > 0 && yape > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 ${className}`}
        title={`Efectivo: S/ ${cash.toFixed(2)} | Yape: S/ ${yape.toFixed(2)}`}
      >
        <Split className="w-3 h-3 text-indigo-600 shrink-0" />
        <span>Efectivo + Yape</span>
      </span>
    );
  }

  if (cash > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}
      >
        <Banknote className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Efectivo</span>
      </span>
    );
  }

  if (yape > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 ${className}`}
      >
        <Smartphone className="w-3 h-3 text-purple-600 shrink-0" />
        <span>Yape</span>
      </span>
    );
  }

  if (own > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 ${className}`}
      >
        <Wallet className="w-3 h-3 text-amber-600 shrink-0" />
        <span>De mi bolsillo</span>
      </span>
    );
  }

  return null;
}
