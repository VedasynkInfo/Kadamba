import { Router } from 'express';
import { param } from 'express-validator';
import {
  createGallery,
  getGallery,
  listGallery,
  removeGallery,
  updateGallery,
} from '../controllers/galleryController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { validateBody } from '../middleware/validateBody';
import { galleryWriteSchema } from '../shared/schemas';

const router = Router();

router.get('/', optionalAuthenticate, listGallery);
router.get('/:idOrSlug', optionalAuthenticate, getGallery);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  validateBody(galleryWriteSchema),
  createGallery,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  // Same contract, every field optional: a partial update is the PUT shape the
  // admin editor actually sends.
  validateBody(galleryWriteSchema.partial()),
  updateGallery,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removeGallery,
);

export default router;
