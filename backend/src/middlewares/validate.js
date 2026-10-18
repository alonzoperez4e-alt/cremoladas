import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Middleware para validar el cuerpo de la petición contra un esquema de Zod
 * @param {import('zod').ZodSchema} schema - Esquema de validación
 * @returns {import('express').RequestHandler}
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));

    return next(
      new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Error de validación en los datos enviados',
        details
      )
    );
  }

  req.body = result.data;
  next();
};
