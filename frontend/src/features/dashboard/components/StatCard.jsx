import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatCurrency } from '../../../lib/format';
import { AlertCircle, RotateCcw } from 'lucide-react';

export function StatCard({
  title,
  amount,
  subtitle,
  icon: Icon,
  variant = 'neutral', // 'investment' | 'revenue' | 'profit'
  isLoading = false,
  isError = false,
  onRetry,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-2xs flex flex-col justify-between gap-3">
        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">{title}</span>
        </div>
        <p className="text-xs text-slate-500">No se pudo cargar</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 cursor-pointer self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const isProfit = variant === 'profit';
  const isNegative = isProfit && amount < 0;

  // Estilos de acento
  const iconVariants = {
    investment: 'bg-purple-50 text-purple-600',
    revenue: 'bg-emerald-50 text-emerald-600',
    profit: isNegative ? 'bg-rose-50 text-rose-600' : 'bg-pink-50 text-pink-600',
    neutral: 'bg-slate-50 text-slate-600',
  };

  const amountColor = isProfit
    ? isNegative
      ? 'text-rose-600'
      : 'text-emerald-600'
    : 'text-slate-900';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              iconVariants[variant] || iconVariants.neutral
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${amountColor}`}>
          {formatCurrency(amount)}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
