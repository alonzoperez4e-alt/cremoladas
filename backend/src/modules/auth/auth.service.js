import { authRepository } from './auth.repository.js';
import { hashPassword, comparePassword, compareDummyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export const authService = {
  /**
   * Autentica a un usuario y genera un token JWT
   * @param {object} params
   * @param {string} params.username
   * @param {string} params.password
   * @returns {Promise<{ token: string, user: { id: string|number, username: string, fullName: string|null } }>}
   */
  async login({ username, password }) {
    const user = await authRepository.findByUsername(username);

    // Si el usuario no existe, ejecutamos igualmente un compare contra un hash ficticio
    // con cost factor 12 para mitigar ataques de temporización (timing attack mitigation).
    if (!user) {
      await compareDummyPassword(password);
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Usuario o contraseña incorrectos'
      );
    }

    // Comprobamos la contraseña contra el hash almacenado
    const isPasswordValid = await comparePassword(password, user.password_hash);

    // Si la contraseña no coincide o el usuario está inactivo, retornamos exactamente
    // el mismo mensaje genérico 401 para no revelar si el usuario existe o si está desactivado.
    if (!isPasswordValid || !user.is_active) {
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Usuario o contraseña incorrectos'
      );
    }

    // Generar token JWT firmado
    const token = signToken({
      sub: String(user.id),
      username: user.username,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
      },
    };
  },

  /**
   * Obtiene la información actualizada del usuario autenticado consultando la base de datos
   * @param {string|number} userId
   * @returns {Promise<{ id: string|number, username: string, fullName: string|null }>}
   */
  async getMe(userId) {
    const user = await authRepository.findById(userId);

    if (!user || !user.is_active) {
      throw new AppError(
        401,
        ERROR_CODES.USER_INACTIVE,
        'Usuario inactivo o no encontrado'
      );
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
    };
  },

  /**
   * Cambia la contraseña del usuario previa verificación de la actual
   * @param {string|number} userId
   * @param {object} params
   * @param {string} params.currentPassword
   * @param {string} params.newPassword
   * @returns {Promise<{ message: string }>}
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await authRepository.findWithPasswordById(userId);

    if (!user || !user.is_active) {
      throw new AppError(
        401,
        ERROR_CODES.USER_INACTIVE,
        'Usuario inactivo o no encontrado'
      );
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError(
        400,
        ERROR_CODES.INVALID_CURRENT_PASSWORD,
        'La contraseña actual es incorrecta'
      );
    }

    const newHash = await hashPassword(newPassword);
    await authRepository.updatePassword(userId, newHash);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  },
};
