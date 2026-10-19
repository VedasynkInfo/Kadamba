import { Router } from 'express';
import { param } from 'express-validator';
import {
  createServiceHandler,
  getServiceHandler,
  listServicesHandler,
  removeServiceHandler,
  updateServiceHandler,
} from '../controllers/serviceController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { validateBody } from '../middleware/validateBody';
import { serviceWriteSchema } from '../shared/schemas';

const router = Router();

router.get('/', optionalAuthenticate, listServicesHandler);
router.get('/:idOrSlug', optionalAuthenticate, getServiceHandler);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  validateBody(serviceWriteSchema),
  createServiceHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  validateBody(serviceWriteSchema.partial()),
  updateServiceHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('content:write'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removeServiceHandler,
);

export default router;
