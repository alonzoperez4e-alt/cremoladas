import { apiClient } from './client';

export const authApi = {
  /**
   * Inicia sesión con credenciales
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: { id: number, username: string, fullName: string } }>}
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    // El backend puede devolver { token, user } o { data: { token, user } }
    return response.data?.data || response.data;
  },

  /**
   * Obtiene la información del usuario en sesión
   * @returns {Promise<{ user: { id: number, username: string, fullName: string } }>}
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data?.user || response.data?.data?.user || response.data;
  },

  /**
   * Cambia la contraseña del usuario
   * @param {{ currentPassword: string, newPassword: string }} payload
   */
  async changePassword(payload) {
    const response = await apiClient.post('/auth/change-password', payload);
    return response.data;
  },
};
