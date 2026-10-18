import { apiClient } from './client';

export const expensesApi = {
  /**
   * Obtiene gastos paginados con filtros
   * @param {{ page?: number, pageSize?: number, from?: string, to?: string, materialId?: number|string }} [params]
   */
  async getAll(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.pageSize) cleanParams.pageSize = params.pageSize;
    if (params.from) cleanParams.from = params.from;
    if (params.to) cleanParams.to = params.to;
    if (params.materialId) cleanParams.materialId = params.materialId;

    const response = await apiClient.get('/expenses', { params: cleanParams });
    return {
      items: response.data?.data || [],
      pagination: response.data?.pagination || { page: 1, pageSize: 20, total: 0 },
      summary: response.data?.summary || { totalAmount: 0 },
    };
  },

  /**
   * Registra un nuevo gasto
   * @param {{ materialId: number|string, amount: number, expenseDate?: string, description?: string }} data
   */
  async create(data) {
    const response = await apiClient.post('/expenses', data);
    return response.data?.data || response.data;
  },

  /**
   * Actualiza un gasto existente
   * @param {number|string} id
   * @param {{ materialId: number|string, amount: number, expenseDate?: string, description?: string }} data
   */
  async update(id, data) {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Elimina un gasto
   * @param {number|string} id
   */
  async delete(id) {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data?.data || response.data;
  },
};
