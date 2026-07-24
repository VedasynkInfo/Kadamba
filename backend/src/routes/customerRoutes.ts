import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createCustomerHandler,
  listCustomersHandler,
  getCustomerHandler,
  updateCustomerHandler,
  addCustomerNoteHandler,
  getCustomerOrdersHandler,
  getCustomerMeasurementsHandler,
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Protect all CRM paths
router.use(authenticate);
router.use(authorize('admin'));

router.get(
  '/',
  [
    query('q').optional().trim(),
    query('locality').optional().trim(),
    query('tag').optional().trim(),
    query('portalStatus').optional().trim(),
    query('source').optional().trim(),
    query('hasOpenOrders').optional().isBoolean().withMessage('hasOpenOrders must be boolean'),
  ],
  validateRequest,
  listCustomersHandler,
);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Please provide a valid email'),
    body('whatsapp').optional().trim(),
    body('address').optional().isObject().withMessage('Address details must be an object'),
    body('source').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('notes').optional().trim(),
    body('force').optional().isBoolean().withMessage('Force parameter must be boolean'),
  ],
  validateRequest,
  createCustomerHandler,
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid Customer ID')],
  validateRequest,
  getCustomerHandler,
);

router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid Customer ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Please provide a valid email'),
    body('whatsapp').optional().trim(),
    body('address').optional().isObject().withMessage('Address details must be an object'),
    body('source').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('notes').optional().trim(),
    body('portalStatus').optional().trim(),
    body('preferredUnit').optional().isIn(['in', 'cm']).withMessage('preferredUnit must be in or cm'),
    body('archive').optional().isBoolean().withMessage('Archive must be boolean'),
  ],
  validateRequest,
  updateCustomerHandler,
);

router.post(
  '/:id/notes',
  [
    param('id').isMongoId().withMessage('Invalid Customer ID'),
    body('body').trim().notEmpty().withMessage('Note content is required'),
    body('pinned').optional().isBoolean().withMessage('Pinned must be boolean'),
  ],
  validateRequest,
  addCustomerNoteHandler,
);

router.get(
  '/:id/orders',
  [param('id').isMongoId().withMessage('Invalid Customer ID')],
  validateRequest,
  getCustomerOrdersHandler,
);

router.get(
  '/:id/measurements',
  [param('id').isMongoId().withMessage('Invalid Customer ID')],
  validateRequest,
  getCustomerMeasurementsHandler,
);

export default router;
