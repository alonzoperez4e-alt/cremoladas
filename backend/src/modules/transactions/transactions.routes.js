import { Router } from 'express';
import { transactionsController } from './transactions.controller.js';
import { getTransactionsQuerySchema } from './transactions.schemas.js';
import { validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', validateQuery(getTransactionsQuerySchema), asyncHandler(transactionsController.getAll));

export default router;
