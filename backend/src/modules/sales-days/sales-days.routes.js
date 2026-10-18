import { Router } from 'express';
import { salesDaysController } from './sales-days.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/today', asyncHandler(salesDaysController.getToday));
router.post('/today/start', asyncHandler(salesDaysController.startToday));
router.post('/today/close', asyncHandler(salesDaysController.closeToday));
router.get('/today/sales', asyncHandler(salesDaysController.getTodaySales));
router.get('/', asyncHandler(salesDaysController.getHistory));

export default router;
