import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getOrdersByStatusHandler,
  getDeliveriesTrialsHandler,
  getRevenueTrendHandler,
  getRevenueByProductHandler,
  getRevenueByServiceHandler,
  getOutstandingHandler,
  getExpensesSalariesHandler,
  getPnlHandler,
  getLeadsConversionHandler,
  getStaffWorkloadHandler,
  getCustomerRepeatHandler,
  exportReportHandler,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { REPORT_TYPES } from '../services/reportService';

const router = Router();

const dateRangeValidators = [
  query('from').isISO8601().withMessage('from parameter must be a valid ISO8601 date'),
  query('to').isISO8601().withMessage('to parameter must be a valid ISO8601 date'),
];

const optionalAsOf = [
  query('asOf').optional().isISO8601().withMessage('asOf must be a valid ISO8601 date'),
];

router.get(
  '/orders-by-status',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getOrdersByStatusHandler,
);

router.get(
  '/deliveries-trials',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getDeliveriesTrialsHandler,
);

router.get(
  '/revenue-trend',
  authenticate,
  authorize('admin'),
  [
    ...dateRangeValidators,
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('groupBy must be day, week, or month'),
  ],
  validateRequest,
  getRevenueTrendHandler,
);

router.get(
  '/revenue-by-product',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getRevenueByProductHandler,
);

router.get(
  '/revenue-by-service',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getRevenueByServiceHandler,
);

router.get(
  '/outstanding',
  authenticate,
  authorize('admin'),
  optionalAsOf,
  validateRequest,
  getOutstandingHandler,
);

router.get(
  '/expenses-salaries',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getExpensesSalariesHandler,
);

router.get(
  '/pnl',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getPnlHandler,
);

router.get(
  '/leads-conversion',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getLeadsConversionHandler,
);

router.get(
  '/staff-workload',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getStaffWorkloadHandler,
);

router.get(
  '/customer-repeat',
  authenticate,
  authorize('admin'),
  dateRangeValidators,
  validateRequest,
  getCustomerRepeatHandler,
);

router.get(
  '/export/:type',
  authenticate,
  authorize('admin'),
  [
    param('type').isIn([...REPORT_TYPES]).withMessage('Invalid report type'),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('asOf').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  validateRequest,
  exportReportHandler,
);

export default router;
