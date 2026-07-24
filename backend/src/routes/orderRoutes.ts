import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listOrdersHandler,
  getOrderHandler,
  createOrderHandler,
  updateOrderHandler,
  transitionOrderStatusHandler,
  assignStaffHandler,
  linkMeasurementProfilesHandler,
  addOrderNoteHandler,
  convertLeadHandler,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { ORDER_STATUSES, ORDER_PRIORITIES } from '../models/Order';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('admin'),
  [
    query('q').optional().trim(),
    query('status').optional(),
    query('priority').optional().isIn(['', ...ORDER_PRIORITIES]),
    query('deliveryFrom').optional().isISO8601(),
    query('deliveryTo').optional().isISO8601(),
  ],
  validateRequest,
  listOrdersHandler,
);

router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Order ID'),
  ],
  validateRequest,
  getOrderHandler,
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('customerId').isMongoId().withMessage('Valid customer ID is required'),
    body('leadId').optional().isMongoId().withMessage('Valid lead ID is required'),
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('status').optional().isIn(ORDER_STATUSES),
    body('priority').optional().isIn(ORDER_PRIORITIES),
    body('lineItems').isArray({ min: 1 }).withMessage('At least one line item is required'),
    body('lineItems.*.name').trim().notEmpty().withMessage('Line item name is required'),
    body('lineItems.*.qty').optional().isInt({ min: 1 }).withMessage('Line item quantity must be at least 1'),
    body('expectedTrialAt').optional().isISO8601().withMessage('Expected trial date must be ISO8601 format'),
    body('expectedDeliveryAt').optional().isISO8601().withMessage('Expected delivery date must be ISO8601 format'),
    body('tags').optional().isArray(),
    body('paymentSummary.totalQuoted').optional().isFloat({ min: 0 }),
    body('paymentSummary.advance').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
  ],
  validateRequest,
  createOrderHandler,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Order ID'),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('priority').optional().isIn(ORDER_PRIORITIES),
    body('lineItems').optional().isArray({ min: 1 }),
    body('expectedTrialAt').optional().custom((v) => !v || !isNaN(Date.parse(v))),
    body('expectedDeliveryAt').optional().custom((v) => !v || !isNaN(Date.parse(v))),
    body('paymentSummary.totalQuoted').optional().isFloat({ min: 0 }),
    body('paymentSummary.advance').optional().isFloat({ min: 0 }),
    body('paymentSummary.totalPaid').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray(),
  ],
  validateRequest,
  updateOrderHandler,
);

router.post(
  '/:id/status',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Order ID'),
    body('status').isIn(ORDER_STATUSES).withMessage('Valid status is required'),
    body('note').optional().trim(),
  ],
  validateRequest,
  transitionOrderStatusHandler,
);

router.post(
  '/:id/assign',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Order ID'),
    body('assignedStaff').isArray().withMessage('Assigned staff must be an array'),
    body('assignedStaff.*.name').trim().notEmpty().withMessage('Staff name is required'),
    body('assignedStaff.*.role').isIn(['cutter', 'stitcher', 'maggam', 'finishing', 'designer']).withMessage('Invalid staff role'),
  ],
  validateRequest,
  assignStaffHandler,
);

router.post(
  '/:id/link-measurements',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Order ID'),
    body('measurementProfileIds').isArray().withMessage('Measurement profile ids must be an array'),
  ],
  validateRequest,
  linkMeasurementProfilesHandler,
);

router.post(
  '/:id/notes',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Order ID'),
    body('body').trim().notEmpty().withMessage('Note body cannot be empty'),
    body('visibility').optional().isIn(['internal', 'customer']),
  ],
  validateRequest,
  addOrderNoteHandler,
);

router.post(
  '/from-lead/:leadId',
  authenticate,
  authorize('admin'),
  [
    param('leadId').isMongoId().withMessage('Invalid Lead ID'),
  ],
  validateRequest,
  convertLeadHandler,
);

export default router;
