import { Router } from 'express';
import { materialsController } from './materials.controller.js';
import { materialSchema } from './materials.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(materialsController.getAll));
router.post('/', validateBody(materialSchema), asyncHandler(materialsController.create));
router.put('/:id', validateBody(materialSchema), asyncHandler(materialsController.update));
router.delete('/:id', asyncHandler(materialsController.delete));

export default router;
