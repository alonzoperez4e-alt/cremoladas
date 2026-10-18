import { Router } from 'express';
import { salesController } from './sales.controller.js';
import { createSaleSchema } from './sales.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/', validateBody(createSaleSchema), asyncHandler(salesController.create));

export default router;
