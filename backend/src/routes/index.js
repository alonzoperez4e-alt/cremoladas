import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import { checkDbHealth } from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * GET /api/health
 * Endpoint público de salud del sistema y conectividad con Neon PostgreSQL
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const isDbAlive = await checkDbHealth();
    const timestamp = new Date().toISOString();

    if (isDbAlive) {
      return res.status(200).json({
        status: 'ok',
        db: 'up',
        timestamp,
      });
    }

    return res.status(503).json({
      status: 'degraded',
      db: 'down',
      timestamp,
    });
  })
);

// Módulo de Autenticación
router.use('/auth', authRoutes);

// =============================================================================
// FUTUROS MÓDULOS (listos para registrar sus rutas y aplicar requireAuth):
// router.use('/sabores', requireAuth, saboresRoutes);
// router.use('/gastos', requireAuth, gastosRoutes);
// router.use('/preparaciones', requireAuth, preparacionesRoutes);
// router.use('/ventas', requireAuth, ventasRoutes);
// =============================================================================

export default router;
