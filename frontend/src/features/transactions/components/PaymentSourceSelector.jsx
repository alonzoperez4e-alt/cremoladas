import React, { useState, useEffect } from 'react';
import { Banknote, Smartphone, Split, Wallet, AlertCircle } from 'lucide-react';
import { useStatsSummary } from '../../dashboard/hooks/useStats';
import { formatCurrency } from '../../../lib/format';

const STORAGE_KEY = 'cremoladas_last_payment_mode';

export function PaymentSourceSelector({
  amount = 0,
  value = null, // { cashAmount: 0, yapeAmount: 0, ownAmount: 0 }
  onChange,
  existingPayment = null,
  isEdit = false,
  error = null,
}) {
  const { data: stats } = useStatsSummary();
  const numericAmount = Math.max(0, Number(amount) || 0);

  // Saldos disponibles calculados teniendo en cuenta lo que este registro ya tomó si se edita
  const availableCash =
    (stats?.balances?.cash ?? 0) + (isEdit ? Number(existingPayment?.cashAmount || 0) : 0);
  const availableYape =
    (stats?.balances?.yape ?? 0) + (isEdit ? Number(existingPayment?.yapeAmount || 0) : 0);

  // Determinar modo inicial
  const determineInitialMode = () => {
    if (value) {
      if (value.ownAmount > 0) return 'own';
      if (value.cashAmount > 0 && value.yapeAmount > 0) return 'mixed';
      if (value.cashAmount > 0) return 'cash';
      if (value.yapeAmount > 0) return 'yape';
    }
    if (isEdit && existingPayment) {
      if (existingPayment.ownAmount > 0) return 'own';
      if (existingPayment.cashAmount > 0 && existingPayment.yapeAmount > 0) return 'mixed';
      if (existingPayment.cashAmount > 0) return 'cash';
      if (existingPayment.yapeAmount > 0) return 'yape';
    }
    if (!isEdit) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (['cash', 'yape', 'mixed', 'own'].includes(saved)) {
        return saved;
      }
    }
    return '';
  };

  const [mode, setMode] = useState(determineInitialMode);
  const [mixedCash, setMixedCash] = useState(() => {
    if (value?.cashAmount) return String(value.cashAmount);
    if (isEdit && existingPayment?.cashAmount) return String(existingPayment.cashAmount);
    return '';
  });
  const [mixedYape, setMixedYape] = useState(() => {
    if (value?.yapeAmount) return String(value.yapeAmount);
    if (isEdit && existingPayment?.yapeAmount) return String(existingPayment.yapeAmount);
    return '';
  });

  // Notificar al componente padre cuando cambie el modo, los montos o los saldos disponibles
  useEffect(() => {
    if (!mode) {
      onChange?.({
        cashAmount: 0,
        yapeAmount: 0,
        ownAmount: 0,
        isValid: false,
        mode: '',
        errorMessage: 'Es obligatorio elegir el origen del dinero',
      });
      return;
    }

    if (mode === 'cash') {
      const isInsufficient = numericAmount > availableCash;
      onChange?.({
        cashAmount: numericAmount,
        yapeAmount: 0,
        ownAmount: 0,
        isValid: numericAmount > 0 && !isInsufficient,
        mode: 'cash',
        errorMessage: isInsufficient
          ? `Saldo insuficiente en Efectivo (disponible ${formatCurrency(availableCash)})`
          : null,
      });
    } else if (mode === 'yape') {
      const isInsufficient = numericAmount > availableYape;
      onChange?.({
        cashAmount: 0,
        yapeAmount: numericAmount,
        ownAmount: 0,
        isValid: numericAmount > 0 && !isInsufficient,
        mode: 'yape',
        errorMessage: isInsufficient
          ? `Saldo insuficiente en Yape (disponible ${formatCurrency(availableYape)})`
          : null,
      });
    } else if (mode === 'own') {
      onChange?.({
        cashAmount: 0,
        yapeAmount: 0,
        ownAmount: numericAmount,
        isValid: numericAmount > 0,
        mode: 'own',
        errorMessage: null,
      });
    } else if (mode === 'mixed') {
      const c = Number(mixedCash) || 0;
      const y = Number(mixedYape) || 0;
      const sumCents = Math.round(c * 100) + Math.round(y * 100);
      const targetCents = Math.round(numericAmount * 100);

      let errorMessage = null;
      if (c > availableCash) {
        errorMessage = `Saldo insuficiente en Efectivo (disponible ${formatCurrency(availableCash)})`;
      } else if (y > availableYape) {
        errorMessage = `Saldo insuficiente en Yape (disponible ${formatCurrency(availableYape)})`;
      } else if (sumCents !== targetCents) {
        const diff = (targetCents - sumCents) / 100;
        errorMessage =
          diff > 0
            ? `Faltan ${formatCurrency(Math.abs(diff))} para completar el monto`
            : `Sobran ${formatCurrency(Math.abs(diff))} respecto al monto total`;
      }

      onChange?.({
        cashAmount: c,
        yapeAmount: y,
        ownAmount: 0,
        isValid: sumCents === targetCents && c <= availableCash && y <= availableYape && targetCents > 0,
        mode: 'mixed',
        errorMessage,
      });
    }
  }, [mode, numericAmount, mixedCash, mixedYape, availableCash, availableYape, onChange]);

  const handleSelectMode = (newMode) => {
    setMode(newMode);
    if (!isEdit) {
      localStorage.setItem(STORAGE_KEY, newMode);
    }

    if (newMode === 'mixed') {
      // Auto-repartir según saldos disponibles
      const half = Math.round((numericAmount / 2) * 100) / 100;
      const cashPart = Math.min(half, availableCash);
      const yapePart = Math.round((numericAmount - cashPart) * 100) / 100;
      setMixedCash(cashPart > 0 ? String(cashPart) : '');
      setMixedYape(yapePart > 0 ? String(yapePart) : '');
    }
  };

  const handleCashChange = (val) => {
    setMixedCash(val);
    const parsed = Number(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const rest = Math.round((numericAmount - parsed) * 100) / 100;
      setMixedYape(rest >= 0 ? String(rest) : '0');
    }
  };

  const handleYapeChange = (val) => {
    setMixedYape(val);
    const parsed = Number(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const rest = Math.round((numericAmount - parsed) * 100) / 100;
      setMixedCash(rest >= 0 ? String(rest) : '0');
    }
  };

  const options = [
    {
      id: 'cash',
      label: 'Efectivo',
      icon: Banknote,
      balance: availableCash,
      disabled: numericAmount > availableCash,
    },
    {
      id: 'yape',
      label: 'Yape',
      icon: Smartphone,
      balance: availableYape,
      disabled: numericAmount > availableYape,
    },
    {
      id: 'mixed',
      label: 'Efectivo + Yape',
      icon: Split,
      balance: null,
      disabled: false,
    },
    {
      id: 'own',
      label: 'De mi bolsillo',
      icon: Wallet,
      balance: null,
      note: 'No descuenta de saldos',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">
          Origen del dinero <span className="text-pink-600">*</span>
        </label>
        {mode && (
          <span className="text-[11px] font-medium text-slate-400">
            {mode === 'own' ? 'Aporte propio' : 'Saldo del negocio'}
          </span>
        )}
      </div>

      {/* Grid de 4 opciones tipo tarjeta táctil (responsive 2 columnas, usable en 360px) */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = mode === opt.id;
          const hasInsufficient = opt.balance !== null && numericAmount > opt.balance;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectMode(opt.id)}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[66px] select-none ${
                isSelected
                  ? 'border-pink-500 bg-pink-50/70 ring-2 ring-pink-500/20'
                  : hasInsufficient
                  ? 'border-slate-200 bg-slate-50/80 hover:border-slate-300 opacity-80'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected
                      ? 'text-pink-600'
                      : hasInsufficient
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                />
              </div>

              {opt.balance !== null ? (
                <div className="text-[11px] leading-tight flex items-center justify-between">
                  <span className={hasInsufficient ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                    Disp:
                  </span>
                  <span
                    className={`font-semibold ${
                      hasInsufficient ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {formatCurrency(opt.balance)}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 leading-tight">
                  {opt.id === 'mixed' ? 'Combinar ambos' : 'Por devolver'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detalle si elige 'Efectivo + Yape' */}
      {mode === 'mixed' && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700">
            Distribuir monto ({formatCurrency(numericAmount)}):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-slate-600">Efectivo</label>
                <span className="text-[10px] text-slate-400">
                  Disp: {formatCurrency(availableCash)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={numericAmount}
                  inputMode="decimal"
                  value={mixedCash}
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-slate-600">Yape</label>
                <span className="text-[10px] text-slate-400">
                  Disp: {formatCurrency(availableYape)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={numericAmount}
                  inputMode="decimal"
                  value={mixedYape}
                  onChange={(e) => handleYapeChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nota informativa para "De mi bolsillo" */}
      {mode === 'own' && (
        <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60 flex items-start gap-2">
          <Wallet className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-snug">
            <strong>Bolsillo propio:</strong> No descuenta de tus saldos en Efectivo ni Yape; queda
            registrado como un aporte pendiente por devolverte.
          </p>
        </div>
      )}

      {/* Mensaje de error / advertencia de saldo insuficiente */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
