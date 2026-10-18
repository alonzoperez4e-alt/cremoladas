import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import flavorsRoutes from '../modules/flavors/flavors.routes.js';
import materialsRoutes from '../modules/materials/materials.routes.js';
import expensesRoutes from '../modules/expenses/expenses.routes.js';
import preparationsRoutes from '../modules/preparations/preparations.routes.js';
import salesDaysRoutes from '../modules/sales-days/sales-days.routes.js';
import salesRoutes from '../modules/sales/sales.routes.js';
import statsRoutes from '../modules/stats/stats.routes.js';
import withdrawalsRoutes from '../modules/withdrawals/withdrawals.routes.js';
import transactionsRoutes from '../modules/transactions/transactions.routes.js';
import { requireAuth } from '../middlewares/auth.js';
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

// Módulos protegidos del negocio (requieren token Bearer válido)
router.use('/flavors', requireAuth, flavorsRoutes);
router.use('/materials', requireAuth, materialsRoutes);
router.use('/expenses', requireAuth, expensesRoutes);
router.use('/preparations', requireAuth, preparationsRoutes);
router.use('/sales-days', requireAuth, salesDaysRoutes);
router.use('/sales', requireAuth, salesRoutes);
router.use('/stats', requireAuth, statsRoutes);
router.use('/withdrawals', requireAuth, withdrawalsRoutes);
router.use('/transactions', requireAuth, transactionsRoutes);

export default router;
