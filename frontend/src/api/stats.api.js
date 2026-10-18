import { apiClient } from './client';

export const statsApi = {
  /**
   * Obtiene el resumen general de estadísticas (inversión total, ingresos totales y ganancia neta)
   * @returns {Promise<{ totalInvestment: number, totalRevenue: number, netProfit: number, investmentBreakdown: { preparations: number, expenses: number } }>}
   */
  async getSummary() {
    const response = await apiClient.get('/stats/summary');
    return response.data?.data || response.data;
  },
};
