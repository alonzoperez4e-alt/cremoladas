import { apiClient } from './client';

export const salesDaysApi = {
  /**
   * Obtiene el estado y resumen de la jornada de ventas de hoy (America/Lima)
   * @returns {Promise<{ date: string, status: 'not_started' | 'open' | 'closed', salesDay: object | null, totals: { salesCount: number, cupsSold: number, totalSold: number } }>}
   */
  async getToday() {
    const response = await apiClient.get('/sales-days/today');
    return response.data?.data || response.data;
  },

  /**
   * Inicia la jornada de ventas de hoy
   */
  async startToday() {
    const response = await apiClient.post('/sales-days/today/start');
    return response.data?.data || response.data;
  },

  /**
   * Cierra manualmente la jornada de ventas de hoy
   */
  async closeToday() {
    const response = await apiClient.post('/sales-days/today/close');
    return response.data?.data || response.data;
  },

  /**
   * Obtiene el detalle de ventas y desglose por sabor de la jornada de hoy
   * @returns {Promise<{ salesDay: object, totals: object, sales: Array, byFlavor: Array }>}
   */
  async getTodaySales() {
    const response = await apiClient.get('/sales-days/today/sales');
    return response.data?.data || response.data;
  },
};
