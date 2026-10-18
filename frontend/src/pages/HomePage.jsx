import React from 'react';
import { DollarSign, TrendingUp, PiggyBank } from 'lucide-react';
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
  const prepAmount = stats?.investmentBreakdown?.preparations || 0;
  const expAmount = stats?.investmentBreakdown?.expenses || 0;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Tres tarjetas de estadísticas */}
      <section aria-label="Resumen de estadísticas del negocio">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Inversión total */}
          <StatCard
            title="Inversión total"
            amount={totalInvestment}
            subtitle={`Preparaciones ${formatCurrency(prepAmount)} · Materiales ${formatCurrency(expAmount)}`}
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
            subtitle="Ingresos brutos acumulados por ventas"
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
              netProfit < 0
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

      {/* 2. Cuadro "Venta del día" (funciona como botón) */}
      <section aria-label="Estado de la venta del día">
        <SalesDayCard />
      </section>

      {/* 3. Lista de sabores disponibles con interruptor "Agotado" */}
      <section aria-label="Control de sabores agotados">
        <FlavorAvailabilityList />
      </section>
    </div>
  );
}
