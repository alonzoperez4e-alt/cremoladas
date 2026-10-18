import { authService } from './auth.service.js';

export const authController = {
  /**
   * Manejador de inicio de sesión
   * POST /api/auth/login
   */
  async login(req, res) {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  },

  /**
   * Manejador para obtener perfil del usuario autenticado
   * GET /api/auth/me
   */
  async getMe(req, res) {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({ user });
  },

  /**
   * Manejador para cambiar la contraseña del usuario
   * POST /api/auth/change-password
   */
  async changePassword(req, res) {
    const result = await authService.changePassword(req.user.id, req.body);
    return res.status(200).json(result);
  },
};
