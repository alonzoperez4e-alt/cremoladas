import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Middleware para capturar rutas inexistentes (404)
 */
export const notFound = (req, res, next) => {
  next(
    new AppError(
      404,
      ERROR_CODES.NOT_FOUND,
      `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    )
  );
};
