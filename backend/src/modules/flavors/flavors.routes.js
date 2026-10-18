import { Router } from 'express';
import { flavorsController } from './flavors.controller.js';
import {
  createFlavorSchema,
  updateFlavorSchema,
  updateSoldOutSchema,
} from './flavors.schemas.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(flavorsController.getAll));
router.get('/:id', asyncHandler(flavorsController.getById));
router.post('/', validateBody(createFlavorSchema), asyncHandler(flavorsController.create));
router.put('/:id', validateBody(updateFlavorSchema), asyncHandler(flavorsController.update));
router.patch(
  '/:id/sold-out',
  validateBody(updateSoldOutSchema),
  asyncHandler(flavorsController.setSoldOut)
);
router.delete('/:id', asyncHandler(flavorsController.delete));

export default router;
