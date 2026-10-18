import { Router } from 'express';
import { withdrawalsController } from './withdrawals.controller.js';
import { createWithdrawalSchema } from './withdrawals.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/', validateBody(createWithdrawalSchema), asyncHandler(withdrawalsController.create));
router.delete('/:id', asyncHandler(withdrawalsController.delete));

export default router;
