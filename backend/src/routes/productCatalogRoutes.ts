import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  listProductTypesHandler,
  getProductTypeHandler,
  createProductTypeHandler,
  updateProductTypeHandler,
  reorderProductTypesHandler,
  bulkUpdateProductTypesHandler,
  getProductUsageHandler,
  importProductTypesHandler,
  seedCatalogHandler,
} from '../controllers/productCatalogController';

const router = Router();

// Publicly readable endpoint if needed, but in our case, protect admin console paths
router.use(authenticate, authorize('admin', 'staff'));

// Categories routes
router.get('/categories', requirePermission('catalog:read'), listCategoriesHandler);

router.post(
  '/categories',
  requirePermission('catalog:write'),
  [
    body('code').trim().notEmpty().withMessage('Category code is required'),
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer'),
    body('active').optional().isBoolean().withMessage('active must be a boolean'),
  ],
  validateRequest,
  createCategoryHandler,
);

router.patch(
  '/categories/:id',
  requirePermission('catalog:write'),
  [
    param('id').isMongoId().withMessage('Invalid Category ID'),
    body('code').optional().trim().notEmpty().withMessage('Category code cannot be empty'),
    body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
    body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer'),
    body('active').optional().isBoolean().withMessage('active must be a boolean'),
  ],
  validateRequest,
  updateCategoryHandler,
);

// Product Types routes
router.get(
  '/product-types',
  requirePermission('catalog:read'),
  [
    query('categoryId').optional().trim(),
    query('search').optional().trim(),
    query('active').optional().trim(),
    query('featured').optional().trim(),
  ],
  validateRequest,
  listProductTypesHandler,
);

router.patch(
  '/product-types/reorder',
  requirePermission('catalog:write'),
  [
    body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
    body('ids.*').isMongoId().withMessage('Each id must be a Mongo id'),
  ],
  validateRequest,
  reorderProductTypesHandler,
);

router.patch(
  '/product-types/bulk',
  requirePermission('catalog:write'),
  [
    body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
    body('ids.*').isMongoId().withMessage('Each id must be a Mongo id'),
    body('updates').isObject().withMessage('updates must be an object'),
    body('updates.active').optional().isBoolean().withMessage('active must be a boolean'),
    body('updates.featured').optional().isBoolean().withMessage('featured must be a boolean'),
    body('updates.categoryId').optional().isMongoId().withMessage('categoryId must be a Mongo id'),
  ],
  validateRequest,
  bulkUpdateProductTypesHandler,
);

router.post(
  '/product-types/import',
  requirePermission('catalog:write'),
  [body('rows').isArray({ min: 1, max: 1000 }).withMessage('rows must contain 1-1000 items')],
  validateRequest,
  importProductTypesHandler,
);

router.get(
  '/product-types/:id/usage',
  requirePermission('catalog:read'),
  [param('id').isMongoId().withMessage('Invalid Product Type ID')],
  validateRequest,
  getProductUsageHandler,
);

router.get(
  '/product-types/:id',
  requirePermission('catalog:read'),
  [param('id').isMongoId().withMessage('Invalid Product Type ID')],
  validateRequest,
  getProductTypeHandler,
);

const productTypeBody = [
  body('code').optional().trim().notEmpty().withMessage('Product type code cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Product type name cannot be empty'),
  body('categoryId').optional().isMongoId().withMessage('Valid Category ID is required'),
  body('description').optional({ nullable: true }).trim(),
  body('publicDescription').optional({ nullable: true }).trim(),
  body('slug').optional().trim(),
  body('measurementTemplateId').optional({ nullable: true }).trim(),
  body('measurementTemplateCode').optional({ nullable: true }).trim(),
  body('active').optional().isBoolean().withMessage('active must be a boolean'),
  body('featured').optional().isBoolean().withMessage('featured must be a boolean'),
  body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer'),
  body('leadTimeDays')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 365 })
    .withMessage('leadTimeDays must be a whole number between 0 and 365'),
  body('leadTimeNote').optional({ nullable: true }).trim(),
  body('indicativePriceRange').optional({ nullable: true }).trim(),
  body('defaultStages').optional().isArray().withMessage('defaultStages must be an array'),
  body('gallery').optional().isArray().withMessage('gallery must be an array'),
  body('variants').optional().isArray().withMessage('variants must be an array'),
  body('tags').optional().isArray().withMessage('tags must be an array'),
  body('seo').optional({ nullable: true }).isObject().withMessage('seo must be an object'),
  body('image').optional({ nullable: true }).trim(),
  body('sku').optional({ nullable: true }).trim(),
  body('stockItem').optional({ nullable: true }).trim(),
];

router.post(
  '/product-types',
  requirePermission('catalog:write'),
  [
    body('code').trim().notEmpty().withMessage('Product type code is required'),
    body('name').trim().notEmpty().withMessage('Product type name is required'),
    body('categoryId').isMongoId().withMessage('Valid Category ID is required'),
    ...productTypeBody,
  ],
  validateRequest,
  createProductTypeHandler,
);

router.patch(
  '/product-types/:id',
  requirePermission('catalog:write'),
  [param('id').isMongoId().withMessage('Invalid Product Type ID'), ...productTypeBody],
  validateRequest,
  updateProductTypeHandler,
);

// Catalog Seeder endpoint
router.post('/seed', requirePermission('catalog:write'), seedCatalogHandler);

export default router;
