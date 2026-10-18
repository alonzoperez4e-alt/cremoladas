import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';

/**
 * Middleware centralizado para el manejo de errores en Express
 */
export const errorHandler = (err, req, res, next) => {
  // Manejo de SyntaxError generado por express.json() ante JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Formato de cuerpo JSON inválido',
        details: [],
      },
    });
  }

  // Si es una instancia conocida de AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || [],
      },
    });
  }

  // Errores no controlados (500)
  const statusCode = err.statusCode || 500;
  const isInternal = statusCode >= 500;

  if (isInternal) {
    console.error('💥 Error no controlado en la aplicación:', {
      name: err.name,
      message: err.message,
      stack: env.isDevelopment ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
    });
  }

  const message =
    isInternal && env.isProduction
      ? 'Ocurrió un error interno en el servidor'
      : err.message || 'Error del servidor';

  const code = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: [],
    },
  });
};
