import { apiClient } from './client';

export const salesApi = {
  /**
   * Registra una nueva venta de cremoladas
   * @param {{ items: Array<{ flavorIds: number[], quantity: number }> }} payload
   */
  async createSale(payload) {
    const response = await apiClient.post('/sales', payload);
    return response.data?.data || response.data;
  },
};
