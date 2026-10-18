import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useStatsSummary } from '../../dashboard/hooks/useStats';
import { useCreateWithdrawal } from '../hooks/useTransactions';
import { getTodayLima } from '../../../lib/dates';
import { formatCurrency } from '../../../lib/format';
import { getErrorMessage } from '../../../lib/errors';
import { toast } from 'sonner';
import { AlertTriangle, Banknote, Smartphone, TrendingUp, HandCoins, Info } from 'lucide-react';

export function WithdrawModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { data: stats } = useStatsSummary();
  const createWithdrawal = useCreateWithdrawal();
  const today = getTodayLima();

  const [kind, setKind] = useState('profit'); // 'profit' | 'reimbursement'
  const [cashAmount, setCashAmount] = useState('');
  const [yapeAmount, setYapeAmount] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(today);
  const [description, setDescription] = useState('');
  const [confirmCapitalUse, setConfirmCapitalUse] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Reiniciar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setKind('profit');
      setCashAmount('');
      setYapeAmount('');
      setWithdrawalDate(today);
      setDescription('');
      setConfirmCapitalUse(false);
      setApiError(null);
    }
  }, [isOpen, today]);

  const cashBalance = stats?.balances?.cash ?? 0;
  const yapeBalance = stats?.balances?.yape ?? 0;
  const availableProfit = stats?.availableProfit ?? 0;
  const pendingReimbursement = stats?.pendingReimbursement ?? 0;

  const numCash = Math.max(0, Number(cashAmount) || 0);
  const numYape = Math.max(0, Number(yapeAmount) || 0);
  const totalWithdrawal = Math.round((numCash + numYape) * 100) / 100;

  // Validaciones
  const isCashExceeded = numCash > cashBalance;
  const isYapeExceeded = numYape > yapeBalance;
  const isTotalZero = totalWithdrawal <= 0;

  // Lógica de Ganancia Disponible y Exceso
  const maxSafeProfit = Math.max(0, availableProfit);
  const excessProfit = Math.round((totalWithdrawal - maxSafeProfit) * 100) / 100;
  const isExceedingProfit = kind === 'profit' && excessProfit > 0;

  // Lógica de Devolución
  const isExceedingPending = kind === 'reimbursement' && totalWithdrawal > pendingReimbursement;

  // Deshabilitar botón de envío
  const isSubmitDisabled =
    isTotalZero ||
    isCashExceeded ||
    isYapeExceeded ||
    (isExceedingProfit && !confirmCapitalUse) ||
    isExceedingPending ||
    createWithdrawal.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setApiError(null);
    try {
      await createWithdrawal.mutateAsync({
        kind,
        cashAmount: numCash,
        yapeAmount: numYape,
        withdrawalDate: withdrawalDate || today,
        description: description.trim() || undefined,
        confirmCapitalUse: isExceedingProfit ? true : false,
      });
      onClose();
    } catch (err) {
      // Refrescar saldos inmediatamente
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      const code = err.response?.data?.error?.code;
      const details = err.response?.data?.error?.details;

      if (code === 'EXCEEDS_AVAILABLE_PROFIT') {
        setApiError(
          `Estás retirando más de tu ganancia disponible (${formatCurrency(details?.availableProfit || 0)}). Marca la casilla de confirmación para continuar.`
        );
      } else if (code === 'INSUFFICIENT_BALANCE') {
        const acc = details?.account === 'cash' ? 'Efectivo' : 'Yape';
        setApiError(`Saldo insuficiente en ${acc} (disponible ${formatCurrency(details?.available || 0)}).`);
      } else if (code === 'REIMBURSEMENT_EXCEEDS_PENDING') {
        setApiError(
          `El monto excede lo que tienes pendiente por devolverte (${formatCurrency(details?.pending || 0)}).`
        );
      } else {
        const msg = getErrorMessage(err);
        setApiError(msg);
        toast.error(msg);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={createWithdrawal.isPending ? () => {} : onClose}
      title="Retirar dinero"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Tipo de Retiro */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Motivo del retiro
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setKind('profit');
                setConfirmCapitalUse(false);
                setApiError(null);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[58px] ${
                kind === 'profit'
                  ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-800">Retiro de ganancias</span>
                <TrendingUp
                  className={`w-4 h-4 ${kind === 'profit' ? 'text-pink-600' : 'text-slate-400'}`}
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Ganancia disp: {formatCurrency(availableProfit)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setKind('reimbursement');
                setConfirmCapitalUse(false);
                setApiError(null);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[58px] ${
                kind === 'reimbursement'
                  ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-800">Devolución de aporte</span>
                <HandCoins
                  className={`w-4 h-4 ${kind === 'reimbursement' ? 'text-pink-600' : 'text-slate-400'}`}
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Por devolver: {formatCurrency(pendingReimbursement)}
              </span>
            </button>
          </div>
        </div>

        {/* Campos de montos: Efectivo y Yape con botón "Todo" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monto en Efectivo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                Efectivo
              </label>
              <button
                type="button"
                onClick={() => setCashAmount(String(Math.max(0, cashBalance)))}
                className="text-[11px] font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
              >
                Todo ({formatCurrency(cashBalance)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 bg-white border rounded-xl focus:outline-hidden ${
                  isCashExceeded
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100'
                }`}
              />
            </div>
            {isCashExceeded && (
              <p className="text-[11px] font-medium text-rose-600 mt-0.5">
                Excede el saldo ({formatCurrency(cashBalance)})
              </p>
            )}
          </div>

          {/* Monto en Yape */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                Yape
              </label>
              <button
                type="button"
                onClick={() => setYapeAmount(String(Math.max(0, yapeBalance)))}
                className="text-[11px] font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
              >
                Todo ({formatCurrency(yapeBalance)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={yapeAmount}
                onChange={(e) => setYapeAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 bg-white border rounded-xl focus:outline-hidden ${
                  isYapeExceeded
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100'
                }`}
              />
            </div>
            {isYapeExceeded && (
              <p className="text-[11px] font-medium text-rose-600 mt-0.5">
                Excede el saldo ({formatCurrency(yapeBalance)})
              </p>
            )}
          </div>
        </div>

        {/* Resumen Total */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Total a retirar:</span>
          <span className="text-base font-extrabold text-slate-900">
            {formatCurrency(totalWithdrawal)}
          </span>
        </div>

        {/* Advertencia destacada si excede la ganancia disponible */}
        {isExceedingProfit && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
            <div className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Uso de capital de trabajo</p>
                <p>
                  Estás retirando <strong>{formatCurrency(excessProfit)}</strong> más de tu ganancia
                  neta disponible. Ese dinero sirve para reinvertir en insumos.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 pt-1 border-t border-amber-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmCapitalUse}
                onChange={(e) => setConfirmCapitalUse(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-amber-900">
                Entiendo y confirmo usar capital para este retiro
              </span>
            </label>
          </div>
        )}

        {/* Advertencia si la devolución excede el aporte pendiente */}
        {isExceedingPending && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium">
              El total ({formatCurrency(totalWithdrawal)}) excede tu aporte pendiente por devolver (
              {formatCurrency(pendingReimbursement)}).
            </p>
          </div>
        )}

        {/* Fecha del retiro */}
        <Input
          type="date"
          label="Fecha del retiro"
          id="withdraw-date"
          max={today}
          value={withdrawalDate}
          onChange={(e) => setWithdrawalDate(e.target.value)}
        />

        {/* Descripción opcional */}
        <div className="space-y-1">
          <label htmlFor="withdraw-desc" className="text-xs font-semibold text-slate-700">
            Descripción (opcional)
          </label>
          <input
            id="withdraw-desc"
            type="text"
            maxLength={255}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Retiro para compras personales"
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {/* Mensaje de error general de API */}
        {apiError && (
          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-700">
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createWithdrawal.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createWithdrawal.isPending}
            disabled={isSubmitDisabled}
          >
            Confirmar retiro
          </Button>
        </div>
      </form>
    </Modal>
  );
}
