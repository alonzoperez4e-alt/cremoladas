import { apiClient } from './client';

export const transactionsApi = {
  /**
   * Obtiene transacciones paginadas con filtros y resumen global
   * @param {{ page?: number, pageSize?: number, from?: string, to?: string, type?: string, account?: string }} [params]
   */
  async getAll(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.pageSize) cleanParams.pageSize = params.pageSize;
    if (params.from) cleanParams.from = params.from;
    if (params.to) cleanParams.to = params.to;
    if (params.type) cleanParams.type = params.type;
    if (params.account) cleanParams.account = params.account;

    const response = await apiClient.get('/transactions', { params: cleanParams });
    return {
      items: response.data?.data || [],
      pagination: response.data?.pagination || { page: 1, pageSize: 20, total: 0 },
      summary: response.data?.summary || { totalIn: 0, totalOut: 0 },
    };
  },
};
