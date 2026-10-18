import { apiClient } from './client';

export const withdrawalsApi = {
  /**
   * Registra un nuevo retiro de dinero (ganancia o aporte propio)
   * @param {{ kind: 'profit'|'reimbursement', cashAmount: number, yapeAmount: number, withdrawalDate?: string, description?: string, confirmCapitalUse?: boolean }} data
   */
  async create(data) {
    const response = await apiClient.post('/withdrawals', data);
    return response.data?.data || response.data;
  },

  /**
   * Elimina un retiro existente
   * @param {number|string} id
   */
  async delete(id) {
    const response = await apiClient.delete(`/withdrawals/${id}`);
    return response.data?.data || response.data;
  },
};
