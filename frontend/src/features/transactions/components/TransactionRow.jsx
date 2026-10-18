import React from 'react';
import {
  TrendingUp,
  FlaskConical,
  Receipt,
  HandCoins,
  Trash2,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/format';

export function TransactionRow({ transaction, onDeleteWithdrawal }) {
  const { date, type, account, amount, effect, title, description, refType, refId, kind } =
    transaction;

  // Icono según tipo y referencia
  const getIcon = () => {
    if (type === 'income') {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'withdrawal') {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <HandCoins className="w-4 h-4" />
        </div>
      );
    }
    if (refType === 'preparation') {
      return (
        <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
          <FlaskConical className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Receipt className="w-4 h-4" />
      </div>
    );
  };

  // Badge de cuenta afectada
  const getAccountBadge = () => {
    if (account === 'cash') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <Banknote className="w-2.5 h-2.5" />
          Efectivo
        </span>
      );
    }
    if (account === 'yape') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
          <Smartphone className="w-2.5 h-2.5" />
          Yape
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
        <Wallet className="w-2.5 h-2.5" />
        Bolsillo
      </span>
    );
  };

  // Monto con signo y color
  const renderAmount = () => {
    if (effect === 'in') {
      return (
        <span className="text-sm font-bold text-emerald-600 tracking-tight">
          + {formatCurrency(amount)}
        </span>
      );
    }
    if (effect === 'out') {
      return (
        <span className="text-sm font-bold text-rose-600 tracking-tight">
          − {formatCurrency(amount)}
        </span>
      );
    }
    return (
      <span className="text-sm font-semibold text-slate-500 tracking-tight" title="Bolsillo propio">
        {formatCurrency(amount)}
      </span>
    );
  };

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-2xs hover:border-slate-200 transition-all flex items-start gap-3 min-h-[58px]">
      {getIcon()}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{title}</h4>
            {description && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{description}</p>
            )}
          </div>
          <div className="text-right shrink-0">{renderAmount()}</div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-50">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(date)}
            </span>
            {getAccountBadge()}
          </div>

          {/* Botón para eliminar retiro si es fila de retiro */}
          {type === 'withdrawal' && onDeleteWithdrawal && (
            <button
              type="button"
              onClick={() => onDeleteWithdrawal({ id: refId, title, amount, kind })}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Eliminar este retiro"
              aria-label="Eliminar retiro"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
