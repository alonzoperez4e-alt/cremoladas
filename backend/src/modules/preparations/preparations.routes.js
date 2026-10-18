import { Router } from 'express';
import { preparationsController } from './preparations.controller.js';
import { preparationBodySchema } from './preparations.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(preparationsController.getAll));
router.post('/', validateBody(preparationBodySchema), asyncHandler(preparationsController.create));
router.put('/:id', validateBody(preparationBodySchema), asyncHandler(preparationsController.update));
router.delete('/:id', asyncHandler(preparationsController.delete));

export default router;
