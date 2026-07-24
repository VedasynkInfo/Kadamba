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
    body('bannerAlt').optional().trim(),
    body('cardImage').optional().trim(),
    body('icon').optional().isIn(['bridal', 'traditional', 'tailoring', 'boutique']),
    body('published').optional().isBoolean(),
    body('isFulfillable').optional().isBoolean().withMessage('isFulfillable must be a boolean'),
    body('linkedProductTypeIds').optional().isArray().withMessage('linkedProductTypeIds must be an array'),
    body('linkedProductTypeIds.*').optional().isMongoId().withMessage('Invalid linked product type ID'),
    body('defaultLeadTimeDays').optional().isInt({ min: 0 }).withMessage('defaultLeadTimeDays must be a non-negative integer'),
    body('basePriceFrom').optional().isNumeric({ no_symbols: true }).withMessage('basePriceFrom must be a non-negative number'),
    body('tags').optional().isArray().withMessage('tags must be an array'),
    body('metaTitle').optional().trim(),
    body('metaDescription').optional().trim(),
    body('ogTitle').optional().trim(),
    body('ogDescription').optional().trim(),
    body('ogImage').optional().trim(),
    body('twitterTitle').optional().trim(),
    body('twitterDescription').optional().trim(),
    body('twitterImage').optional().trim(),
  ],
  validateRequest,
  createServiceHandler,
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid id'),
    body('title').optional().trim().isLength({ min: 2, max: 160 }).withMessage('Title must be between 2 and 160 characters'),
    body('category').optional().isIn([...SERVICE_CATEGORIES]).withMessage('Invalid category'),
    body('summary').optional().trim().isLength({ min: 2, max: 500 }).withMessage('Summary must be between 2 and 500 characters'),
    body('bannerImage').optional().trim().notEmpty().withMessage('Banner image cannot be empty'),
    body('bannerAlt').optional().trim(),
    body('cardImage').optional().trim(),
    body('icon').optional().isIn(['bridal', 'traditional', 'tailoring', 'boutique']),
    body('published').optional().isBoolean(),
    body('isFulfillable').optional().isBoolean().withMessage('isFulfillable must be a boolean'),
    body('linkedProductTypeIds').optional().isArray().withMessage('linkedProductTypeIds must be an array'),
    body('linkedProductTypeIds.*').optional().isMongoId().withMessage('Invalid linked product type ID'),
    body('defaultLeadTimeDays').optional().isInt({ min: 0 }).withMessage('defaultLeadTimeDays must be a non-negative integer'),
    body('basePriceFrom').optional().isNumeric({ no_symbols: true }).withMessage('basePriceFrom must be a non-negative number'),
    body('tags').optional().isArray().withMessage('tags must be an array'),
    body('metaTitle').optional().trim(),
    body('metaDescription').optional().trim(),
    body('ogTitle').optional().trim(),
    body('ogDescription').optional().trim(),
    body('ogImage').optional().trim(),
    body('twitterTitle').optional().trim(),
    body('twitterDescription').optional().trim(),
    body('twitterImage').optional().trim(),
  ],
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
