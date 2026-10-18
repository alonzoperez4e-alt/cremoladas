import { Router } from 'express';
import { authController } from './auth.controller.js';
import { loginSchema, changePasswordSchema } from './auth.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { loginRateLimiter } from '../../middlewares/rateLimiters.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Rutas públicas
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login)
);

// Rutas protegidas
router.get(
  '/me',
  requireAuth,
  asyncHandler(authController.getMe)
);

router.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export default router;
