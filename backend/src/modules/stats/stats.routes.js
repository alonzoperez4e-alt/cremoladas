import { Router } from 'express';
import { statsController } from './stats.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/summary', asyncHandler(statsController.getSummary));

export default router;
