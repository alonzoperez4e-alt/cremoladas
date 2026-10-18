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

  // Manejo de errores de base de datos PostgreSQL: Unique violation (23505) -> 409
  if (err.code === '23505') {
    let code = ERROR_CODES.CONFLICT;
    let message = 'El registro enviado ya existe en el sistema';

    const constraint = (err.constraint || '').toLowerCase();
    const detail = (err.detail || '').toLowerCase();

    if (constraint.includes('sales_days') || detail.includes('sale_date')) {
      code = ERROR_CODES.DAY_ALREADY_STARTED;
      message = 'Ya existe una jornada iniciada para hoy';
    } else if (constraint.includes('flavor') || detail.includes('flavor')) {
      code = ERROR_CODES.FLAVOR_NAME_EXISTS;
      message = 'Ya existe un sabor activo con ese nombre';
    } else if (constraint.includes('material') || detail.includes('material')) {
      code = ERROR_CODES.MATERIAL_NAME_EXISTS;
      message = 'Ya existe un material activo con ese nombre';
    }

    return res.status(409).json({
      error: {
        code,
        message,
        details: [],
      },
    });
  }

  // Manejo de errores de base de datos PostgreSQL: Foreign key violation (23503) -> 400
  if (err.code === '23503') {
    let code = ERROR_CODES.VALIDATION_ERROR;
    let message = 'La entidad referenciada no existe o no es válida';

    const constraint = (err.constraint || '').toLowerCase();
    const detail = (err.detail || '').toLowerCase();

    if (constraint.includes('flavor') || detail.includes('flavor')) {
      code = ERROR_CODES.FLAVOR_NOT_FOUND;
      message = 'El sabor especificado no existe';
    } else if (constraint.includes('material') || detail.includes('material')) {
      code = ERROR_CODES.MATERIAL_NOT_FOUND;
      message = 'El material especificado no existe';
    }

    return res.status(400).json({
      error: {
        code,
        message,
        details: [],
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
