import { verifyToken } from '../utils/jwt.js';
import { authRepository } from '../modules/auth/auth.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Middleware para requerir autenticación JWT.
 * Valida el encabezado Authorization Bearer, verifica la firma/expiración del token
 * y corrobora en base de datos que el usuario siga existiendo y esté activo.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        401,
        ERROR_CODES.TOKEN_MISSING,
        'Token de autorización no proporcionado'
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError(
        401,
        ERROR_CODES.TOKEN_INVALID,
        'Formato de token inválido. Utilice el formato: Bearer <token>'
      );
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw new AppError(
        401,
        ERROR_CODES.TOKEN_MISSING,
        'Token de autorización no proporcionado'
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError(
          401,
          ERROR_CODES.TOKEN_EXPIRED,
          'El token de sesión ha expirado'
        );
      }
      throw new AppError(
        401,
        ERROR_CODES.TOKEN_INVALID,
        'Token de autenticación inválido'
      );
    }

    // Consultar el estado del usuario en la base de datos
    const user = await authRepository.findById(decoded.sub);

    if (!user || !user.is_active) {
      throw new AppError(
        401,
        ERROR_CODES.USER_INACTIVE,
        'El usuario no existe o se encuentra inactivo'
      );
    }

    // Inyectar datos del usuario autenticado en la solicitud
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
    };

    next();
  } catch (err) {
    next(err);
  }
};
