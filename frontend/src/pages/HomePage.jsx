import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  Wallet,
  Banknote,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { useStatsSummary } from '../features/dashboard/hooks/useStats';
import { StatCard } from '../features/dashboard/components/StatCard';
import { SalesDayCard } from '../features/dashboard/components/SalesDayCard';
import { FlavorAvailabilityList } from '../features/dashboard/components/FlavorAvailabilityList';
import { formatCurrency } from '../lib/format';

export default function HomePage() {
  const { data: stats, isLoading, isError, refetch } = useStatsSummary();

  const totalInvestment = stats?.totalInvestment || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const netProfit = stats?.netProfit || 0;
  const cashRevenue = stats?.revenueByPaymentMethod?.cash || 0;
  const yapeRevenue = stats?.revenueByPaymentMethod?.yape || 0;

  // Origen de la inversión
  const cashInvested = stats?.investmentBySource?.cash || 0;
  const yapeInvested = stats?.investmentBySource?.yape || 0;
  const ownInvested = stats?.investmentBySource?.own || 0;

  // Retiros
  const totalWithdrawn = stats?.withdrawals?.total || 0;

  // Saldos por cuenta y ganancia disponible
  const cashBalance = stats?.balances?.cash || 0;
  const yapeBalance = stats?.balances?.yape || 0;
  const availableProfit = stats?.availableProfit ?? 0;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Tres tarjetas de estadísticas del negocio */}
      <section aria-label="Resumen de estadísticas del negocio">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Inversión total */}
          <StatCard
            title="Inversión total"
            amount={totalInvestment}
            subtitle={`Efectivo ${formatCurrency(cashInvested)} · Yape ${formatCurrency(
              yapeInvested
            )} · Bolsillo ${formatCurrency(ownInvested)}`}
            icon={PiggyBank}
            variant="investment"
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />

          {/* Ganancias totales (Ingresos) */}
          <StatCard
            title="Ganancias totales"
            amount={totalRevenue}
            subtitle={`Efectivo ${formatCurrency(cashRevenue)} · Yape ${formatCurrency(
              yapeRevenue
            )}`}
            icon={DollarSign}
            variant="revenue"
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />

          {/* Ganancias netas */}
          <StatCard
            title="Ganancias netas"
            amount={netProfit}
            subtitle={
              totalWithdrawn > 0
                ? `${
                    netProfit < 0
                      ? 'Inversión pendiente de recuperar'
                      : 'Rentabilidad neta del negocio'
                  } · Retirado ${formatCurrency(totalWithdrawn)}`
                : netProfit < 0
                ? 'Inversión pendiente de recuperar'
                : 'Rentabilidad neta del negocio'
            }
            icon={TrendingUp}
            variant="profit"
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>
      </section>

      {/* 2. Sección "Mi dinero" con saldos de Efectivo, Yape y Ganancia disponible */}
      <section aria-label="Saldos actuales y ganancia disponible" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-pink-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Mi dinero
            </h2>
          </div>
          <Link
            to="/transacciones"
            className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors"
          >
            <span>Ver transacciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Saldo en efectivo */}
          <StatCard
            title="Saldo en efectivo"
            amount={cashBalance}
            subtitle="Dinero en caja"
            icon={Banknote}
            variant="revenue"
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />

          {/* Saldo en Yape */}
          <StatCard
            title="Saldo en Yape"
            amount={yapeBalance}
            subtitle="Billetera digital"
            icon={Smartphone}
            variant="revenue"
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />

          {/* Ganancia disponible */}
          <StatCard
            title="Ganancia disponible"
            amount={availableProfit}
            subtitle={
              availableProfit < 0
                ? 'Usaste dinero que no era ganancia'
                : 'Disponible para retirar sin tocar capital'
            }
            icon={TrendingUp}
            variant="profit"
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>
      </section>

      {/* 3. Cuadro "Venta del día" */}
      <section aria-label="Estado de la venta del día">
        <SalesDayCard />
      </section>

      {/* 4. Lista de sabores disponibles con interruptor "Agotado" */}
      <section aria-label="Control de sabores agotados">
        <FlavorAvailabilityList />
      </section>
    </div>
  );
}
