import { apiClient } from './client';

export const preparationsApi = {
  /**
   * Obtiene preparaciones paginadas con filtros
   * @param {{ page?: number, pageSize?: number, from?: string, to?: string, flavorId?: number|string }} [params]
   */
  async getAll(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.pageSize) cleanParams.pageSize = params.pageSize;
    if (params.from) cleanParams.from = params.from;
    if (params.to) cleanParams.to = params.to;
    if (params.flavorId) cleanParams.flavorId = params.flavorId;

    const response = await apiClient.get('/preparations', { params: cleanParams });
    return {
      items: response.data?.data || [],
      pagination: response.data?.pagination || { page: 1, pageSize: 20, total: 0 },
      summary: response.data?.summary || { totalAmount: 0 },
    };
  },

  /**
   * Registra una nueva preparación
   * @param {{ flavorId: number|string, investmentAmount: number, prepDate?: string, description?: string }} data
   */
  async create(data) {
    const response = await apiClient.post('/preparations', data);
    return response.data?.data || response.data;
  },

  /**
   * Actualiza una preparación existente
   * @param {number|string} id
   * @param {{ flavorId: number|string, investmentAmount: number, prepDate?: string, description?: string }} data
   */
  async update(id, data) {
    const response = await apiClient.put(`/preparations/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Elimina una preparación
   * @param {number|string} id
   */
  async delete(id) {
    const response = await apiClient.delete(`/preparations/${id}`);
    return response.data?.data || response.data;
  },
};
