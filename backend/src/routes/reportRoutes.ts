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
import { authenticate, authorize, requirePermission } from '../middleware/auth';
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
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getOrdersByStatusHandler,
);

router.get(
  '/deliveries-trials',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getDeliveriesTrialsHandler,
);

router.get(
  '/revenue-trend',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
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
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getRevenueByProductHandler,
);

router.get(
  '/revenue-by-service',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getRevenueByServiceHandler,
);

router.get(
  '/outstanding',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  optionalAsOf,
  validateRequest,
  getOutstandingHandler,
);

router.get(
  '/expenses-salaries',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getExpensesSalariesHandler,
);

router.get(
  '/pnl',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getPnlHandler,
);

router.get(
  '/leads-conversion',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getLeadsConversionHandler,
);

router.get(
  '/staff-workload',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getStaffWorkloadHandler,
);

router.get(
  '/customer-repeat',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
  dateRangeValidators,
  validateRequest,
  getCustomerRepeatHandler,
);

router.get(
  '/export/:type',
  authenticate,
  authorize('admin', 'staff'),
  requirePermission('reports:read'),
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
