import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  recordPaymentHandler,
  listPaymentsHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  recordExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  listExpensesHandler,
  recordSalaryPaymentHandler,
  listSalaryPaymentsHandler,
  getFinanceSummaryHandler,
  getRevenueByProductHandler,
  getProfitLossHandler,
} from '../controllers/financeController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Summary & analytics
router.get(
  '/summary',
  authenticate,
  authorize('admin'),
  [
    query('from').optional().isISO8601().withMessage('From date must be ISO8601 format'),
    query('to').optional().isISO8601().withMessage('To date must be ISO8601 format'),
  ],
  validateRequest,
  getFinanceSummaryHandler,
);

router.get(
  '/revenue-by-product',
  authenticate,
  authorize('admin'),
  [
    query('from').optional().isISO8601().withMessage('From date must be ISO8601 format'),
    query('to').optional().isISO8601().withMessage('To date must be ISO8601 format'),
  ],
  validateRequest,
  getRevenueByProductHandler,
);

router.get(
  '/profit-loss',
  authenticate,
  authorize('admin'),
  [
    query('from').optional().isISO8601().withMessage('From date must be ISO8601 format'),
    query('to').optional().isISO8601().withMessage('To date must be ISO8601 format'),
  ],
  validateRequest,
  getProfitLossHandler,
);

// Invoices (order billing summaries + detail document)
router.get(
  '/invoices',
  authenticate,
  authorize('admin'),
  [
    query('paymentStatus').optional().isIn(['All', 'unpaid', 'partial', 'paid', 'unquoted']),
    query('status').optional().trim(),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
  ],
  validateRequest,
  listInvoicesHandler,
);

router.get(
  '/invoices/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid invoice / order ID')],
  validateRequest,
  getInvoiceHandler,
);

// Payments (Order Payments)
router.get(
  '/payments',
  authenticate,
  authorize('admin'),
  [
    query('orderId').optional().isMongoId().withMessage('Invalid Order ID'),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('year').optional().isInt({ min: 2000 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
  ],
  validateRequest,
  listPaymentsHandler,
);

router.post(
  '/payments',
  authenticate,
  authorize('admin'),
  [
    body('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
    body('method').isIn(['cash', 'upi', 'bank', 'card', 'other']).withMessage('Invalid payment method'),
    body('paidAt').optional().isISO8601().withMessage('Paid date must be ISO8601 format'),
    body('reference').optional().trim(),
    body('notes').optional().trim(),
    body('bypassBalanceCheck').optional().isBoolean(),
  ],
  validateRequest,
  recordPaymentHandler,
);

// Expenses
router.get(
  '/expenses',
  authenticate,
  authorize('admin'),
  [
    query('category').optional().isIn(['fabric', 'embroidery materials', 'rent', 'utilities', 'marketing', 'misc']),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('q').optional().trim(),
  ],
  validateRequest,
  listExpensesHandler,
);

router.post(
  '/expenses',
  authenticate,
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Expense title is required'),
    body('category').isIn(['fabric', 'embroidery materials', 'rent', 'utilities', 'marketing', 'misc']).withMessage('Invalid category'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Expense amount must be greater than 0'),
    body('spentAt').isISO8601().withMessage('Spent date must be a valid ISO8601 date'),
    body('notes').optional().trim(),
    body('attachmentUrl').optional().trim(),
  ],
  validateRequest,
  recordExpenseHandler,
);

router.put(
  '/expenses/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Expense ID'),
    body('title').optional().trim().notEmpty().withMessage('Expense title cannot be empty'),
    body('category').optional().isIn(['fabric', 'embroidery materials', 'rent', 'utilities', 'marketing', 'misc']),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('spentAt').optional().isISO8601(),
  ],
  validateRequest,
  updateExpenseHandler,
);

router.delete(
  '/expenses/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid Expense ID')],
  validateRequest,
  deleteExpenseHandler,
);

// Salary payments
router.get(
  '/salaries',
  authenticate,
  authorize('admin'),
  [
    query('staffId').optional().isMongoId().withMessage('Invalid Staff ID'),
    query('year').optional().isInt(),
    query('month').optional().isInt({ min: 1, max: 12 }),
  ],
  validateRequest,
  listSalaryPaymentsHandler,
);

router.post(
  '/salaries',
  authenticate,
  authorize('admin'),
  [
    body('staffId').isMongoId().withMessage('Valid staff ID is required'),
    body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Salary amount must be greater than 0'),
    body('paidAt').isISO8601().withMessage('Paid date must be ISO8601 format'),
    body('notes').optional().trim(),
  ],
  validateRequest,
  recordSalaryPaymentHandler,
);

export default router;
