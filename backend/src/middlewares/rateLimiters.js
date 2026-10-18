import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Limitador estricto para intentos de inicio de sesión:
 * 10 intentos por IP cada 15 minutos por defecto.
 */
export const loginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MINS * 60 * 1000,
  max: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        429,
        ERROR_CODES.TOO_MANY_REQUESTS,
        `Demasiados intentos de inicio de sesión. Por favor, intente nuevamente en ${env.RATE_LIMIT_LOGIN_WINDOW_MINS} minutos.`
      )
    );
  },
});

/**
 * Limitador general para todas las rutas bajo /api:
 * 100 solicitudes por IP cada 15 minutos por defecto.
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MINS * 60 * 1000,
  max: env.RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        429,
        ERROR_CODES.TOO_MANY_REQUESTS,
        'Límite de solicitudes excedido. Por favor, intente nuevamente más tarde.'
      )
    );
  },
});
