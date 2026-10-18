import { Router } from 'express';
import { expensesController } from './expenses.controller.js';
import { expenseBodySchema } from './expenses.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(expensesController.getAll));
router.post('/', validateBody(expenseBodySchema), asyncHandler(expensesController.create));
router.put('/:id', validateBody(expenseBodySchema), asyncHandler(expensesController.update));
router.delete('/:id', asyncHandler(expensesController.delete));

export default router;
