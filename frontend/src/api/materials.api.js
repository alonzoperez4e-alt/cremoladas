import { apiClient } from './client';

export const materialsApi = {
  /**
   * Obtiene todos los materiales activos
   */
  async getAll() {
    const response = await apiClient.get('/materials');
    return response.data?.data || [];
  },

  /**
   * Registra un nuevo material
   * @param {{ name: string }} data
   */
  async create(data) {
    const response = await apiClient.post('/materials', data);
    return response.data?.data || response.data;
  },

  /**
   * Actualiza el nombre de un material
   * @param {number|string} id
   * @param {{ name: string }} data
   */
  async update(id, data) {
    const response = await apiClient.put(`/materials/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Elimina un material
   * @param {number|string} id
   */
  async delete(id) {
    const response = await apiClient.delete(`/materials/${id}`);
    return response.data?.data || response.data;
  },
};
