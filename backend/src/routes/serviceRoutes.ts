import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createServiceHandler,
  getServiceHandler,
  listServicesHandler,
  removeServiceHandler,
  updateServiceHandler,
} from '../controllers/serviceController';
import { authenticate, authorize } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { validateRequest } from '../middleware/validate';
import { SERVICE_CATEGORIES } from '../models/Service';

const router = Router();

router.get('/', optionalAuthenticate, listServicesHandler);
router.get('/:idOrSlug', optionalAuthenticate, getServiceHandler);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Title is required'),
    body('category').isIn([...SERVICE_CATEGORIES]).withMessage('Invalid category'),
    body('summary').trim().isLength({ min: 2, max: 500 }).withMessage('Summary is required'),
    body('bannerImage').trim().notEmpty().withMessage('Banner image is required'),
    body('bannerAlt').trim().notEmpty().withMessage('Banner alt is required'),
    body('cardImage').trim().notEmpty().withMessage('Card image is required'),
    body('icon').optional().isIn(['bridal', 'traditional', 'tailoring', 'boutique']),
    body('published').optional().isBoolean(),
  ],
  validateRequest,
  createServiceHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  updateServiceHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid id')],
  validateRequest,
  removeServiceHandler,
);

export default router;
