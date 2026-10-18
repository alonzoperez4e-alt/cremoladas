import { apiClient } from './client';

export const flavorsApi = {
  /**
   * Obtiene todos los sabores activos
   * @param {{ availableOnly?: boolean }} [options]
   */
  async getAll({ availableOnly = false } = {}) {
    const params = availableOnly ? { available: 'true' } : {};
    const response = await apiClient.get('/flavors', { params });
    return response.data?.data || [];
  },

  /**
   * Obtiene un sabor por su ID
   * @param {number|string} id
   */
  async getById(id) {
    const response = await apiClient.get(`/flavors/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Registra un nuevo sabor
   * @param {{ name: string, color: string, icon: string }} data
   */
  async create(data) {
    const response = await apiClient.post('/flavors', data);
    return response.data?.data || response.data;
  },

  /**
   * Actualiza los datos de un sabor
   * @param {number|string} id
   * @param {{ name: string, color: string, icon: string }} data
   */
  async update(id, data) {
    const response = await apiClient.put(`/flavors/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Modifica el estado de disponibilidad (Agotado)
   * @param {number|string} id
   * @param {boolean} isSoldOut
   */
  async setSoldOut(id, isSoldOut) {
    const response = await apiClient.patch(`/flavors/${id}/sold-out`, { isSoldOut });
    return response.data?.data || response.data;
  },

  /**
   * Borrado lógico de un sabor
   * @param {number|string} id
   */
  async delete(id) {
    const response = await apiClient.delete(`/flavors/${id}`);
    return response.data?.data || response.data;
  },
};
