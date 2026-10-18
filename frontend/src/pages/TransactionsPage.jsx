import React, { useState } from 'react';
import {
  Wallet,
  Banknote,
  Smartphone,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  X,
  Plus,
  RefreshCw,
  HandCoins,
} from 'lucide-react';
import { useStatsSummary } from '../features/dashboard/hooks/useStats';
import { useTransactions, useDeleteWithdrawal } from '../features/transactions/hooks/useTransactions';
import { WithdrawModal } from '../features/transactions/components/WithdrawModal';
import { TransactionRow } from '../features/transactions/components/TransactionRow';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../lib/format';
import { getTodayLima } from '../lib/dates';

export default function TransactionsPage() {
  const today = getTodayLima();

  // Estados de modales
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawalToDelete, setWithdrawalToDelete] = useState(null);

  // Estados de paginación y filtros
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    type: '',
    account: '',
  });

  // Queries y Mutaciones
  const { data: stats, isLoading: isLoadingStats } = useStatsSummary();
  const {
    data: txData,
    isLoading: isLoadingTx,
    isError: isTxError,
    refetch: refetchTx,
  } = useTransactions({
    page,
    pageSize: 15,
    from: filters.from || undefined,
    to: filters.to || undefined,
    type: filters.type || undefined,
    account: filters.account || undefined,
  });

  const deleteWithdrawal = useDeleteWithdrawal();

  const handleFilterChange = (field, val) => {
    setFilters((prev) => ({ ...prev, [field]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ from: '', to: '', type: '', account: '' });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.from || filters.to || filters.type || filters.account
  );

  const handleDeleteConfirm = async () => {
    if (!withdrawalToDelete) return;
    try {
      await deleteWithdrawal.mutateAsync(withdrawalToDelete.id);
      setWithdrawalToDelete(null);
    } catch {
      // toast manejado en el hook
    }
  };

  // Datos de saldos
  const cashBalance = stats?.balances?.cash ?? 0;
  const yapeBalance = stats?.balances?.yape ?? 0;
  const availableProfit = stats?.availableProfit ?? 0;
  const pendingReimbursement = stats?.pendingReimbursement ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Cabecera con Botón de Retirar Dinero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-pink-600" />
            Transacciones y Saldos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Control de cuentas, flujo de dinero, retiros y aportes
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setIsWithdrawOpen(true)}
          className="w-full sm:w-auto shadow-md"
        >
          <HandCoins className="w-4 h-4 mr-1.5" />
          Retirar dinero
        </Button>
      </div>

      {/* 2. Tarjetas de Saldos de Cuenta */}
      <section aria-label="Saldos por cuenta">
        {isLoadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Saldo Efectivo */}
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Saldo en Efectivo
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(cashBalance)}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                    Dinero físico en caja
                  </p>
                </div>
              </div>

              {/* Saldo Yape */}
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Saldo en Yape
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(yapeBalance)}
                  </p>
                  <p className="text-[11px] font-medium text-purple-600 mt-0.5">
                    Disponible en billetera digital
                  </p>
                </div>
              </div>

              {/* Ganancia Disponible */}
              <div
                className={`p-4 bg-white rounded-2xl border shadow-xs transition-all flex flex-col justify-between ${
                  availableProfit < 0
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-100 hover:border-pink-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ganancia Disponible
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      availableProfit < 0
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-pink-50 text-pink-600'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <p
                    className={`text-2xl font-black tracking-tight ${
                      availableProfit < 0 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(availableProfit)}
                  </p>
                  <p
                    className={`text-[11px] font-medium mt-0.5 ${
                      availableProfit < 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {availableProfit < 0
                      ? 'Usaste dinero que no era ganancia'
                      : 'Libre para retirar sin tocar capital'}
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso de aporte pendiente de devolver si existe */}
            {pendingReimbursement > 0 && (
              <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Pendiente por devolverte:</strong> Invertiste de tu bolsillo y aún no ha
                    sido reembolsado.
                  </span>
                </div>
                <span className="text-sm font-extrabold text-amber-800 shrink-0">
                  {formatCurrency(pendingReimbursement)}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Barra de Resumen del Filtro y Controles de Filtros */}
      <section className="space-y-3" aria-label="Historial de movimientos">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Movimientos</h2>
            {txData?.pagination?.total !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {txData.pagination.total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                hasActiveFilters
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 px-2 py-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Panel Desplegable de Filtros */}
        {showFilters && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Desde */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  max={filters.to || today}
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500"
                />
              </div>

              {/* Hasta */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  min={filters.from || undefined}
                  max={today}
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="income">Ventas (Ingresos)</option>
                  <option value="investment">Inversiones</option>
                  <option value="withdrawal">Retiros</option>
                </select>
              </div>

              {/* Cuenta */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Cuenta
                </label>
                <select
                  value={filters.account}
                  onChange={(e) => handleFilterChange('account', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-pink-500"
                >
                  <option value="">Todas las cuentas</option>
                  <option value="cash">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="own">Bolsillo propio</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de Resumen de Entradas y Salidas sobre el filtro actual */}
        {txData?.summary && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-900">Entradas</span>
              </div>
              <span className="text-sm font-black text-emerald-700">
                + {formatCurrency(txData.summary.totalIn)}
              </span>
            </div>

            <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-rose-900">Salidas</span>
              </div>
              <span className="text-sm font-black text-rose-700">
                − {formatCurrency(txData.summary.totalOut)}
              </span>
            </div>
          </div>
        )}

        {/* 4. Lista de Movimientos */}
        {isLoadingTx ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : isTxError ? (
          <ErrorState
            title="Error al cargar transacciones"
            description="No pudimos obtener el historial de movimientos."
            onRetry={refetchTx}
          />
        ) : !txData?.items?.length ? (
          <EmptyState
            title="Sin movimientos registrados"
            description={
              hasActiveFilters
                ? 'No hay movimientos con los filtros seleccionados.'
                : 'Aún no se han generado transacciones de ventas, inversiones o retiros.'
            }
            actionText={hasActiveFilters ? 'Limpiar filtros' : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="space-y-2">
            {txData.items.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onDeleteWithdrawal={(wth) => setWithdrawalToDelete(wth)}
              />
            ))}

            {/* Paginación */}
            {txData.pagination && txData.pagination.total > 15 && (
              <div className="pt-3">
                <Pagination
                  currentPage={page}
                  totalItems={txData.pagination.total}
                  pageSize={15}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Retirar Dinero */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
      />

      {/* Diálogo de Confirmación para Eliminar Retiro */}
      <ConfirmDialog
        isOpen={Boolean(withdrawalToDelete)}
        onClose={() => setWithdrawalToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar este retiro?"
        description={`Se cancelará el ${withdrawalToDelete?.title?.toLowerCase()} de ${formatCurrency(
          withdrawalToDelete?.amount || 0
        )} y se restablecerán los saldos correspondientes.`}
        confirmText="Sí, eliminar retiro"
        cancelText="Conservar"
        variant="danger"
        loading={deleteWithdrawal.isPending}
      />
    </div>
  );
}
