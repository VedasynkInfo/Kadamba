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
  ],
  validateRequest,
  listProductTypesHandler,
);

router.get(
  '/product-types/:id',
  requirePermission('catalog:read'),
  [param('id').isMongoId().withMessage('Invalid Product Type ID')],
  validateRequest,
  getProductTypeHandler,
);

router.post(
  '/product-types',
  requirePermission('catalog:write'),
  [
    body('code').trim().notEmpty().withMessage('Product type code is required'),
    body('name').trim().notEmpty().withMessage('Product type name is required'),
    body('categoryId').isMongoId().withMessage('Valid Category ID is required'),
    body('description').optional().trim(),
    body('publicDescription').optional().trim(),
    body('measurementTemplateId').optional().trim(),
    body('active').optional().isBoolean().withMessage('active must be a boolean'),
    body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer'),
    body('indicativePriceRange').optional().trim(),
    body('defaultStages').optional().isArray().withMessage('defaultStages must be an array'),
    body('image').optional().trim(),
  ],
  validateRequest,
  createProductTypeHandler,
);

router.patch(
  '/product-types/:id',
  requirePermission('catalog:write'),
  [
    param('id').isMongoId().withMessage('Invalid Product Type ID'),
    body('code').optional().trim().notEmpty().withMessage('Product type code cannot be empty'),
    body('name').optional().trim().notEmpty().withMessage('Product type name cannot be empty'),
    body('categoryId').optional().isMongoId().withMessage('Valid Category ID is required'),
    body('description').optional().trim(),
    body('publicDescription').optional().trim(),
    body('measurementTemplateId').optional().trim(),
    body('active').optional().isBoolean().withMessage('active must be a boolean'),
    body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer'),
    body('indicativePriceRange').optional().trim(),
    body('defaultStages').optional().isArray().withMessage('defaultStages must be an array'),
    body('image').optional().trim(),
  ],
  validateRequest,
  updateProductTypeHandler,
);

// Catalog Seeder endpoint
router.post('/seed', requirePermission('catalog:write'), seedCatalogHandler);

export default router;
