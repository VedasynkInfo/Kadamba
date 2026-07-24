import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createStaffHandler,
  getStaffHandler,
  updateStaffHandler,
  listStaffHandler,
  addPerformanceNoteHandler,
} from '../controllers/staffController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('admin'),
  [
    query('status').optional().isIn(['active', 'inactive']),
    query('employmentType').optional().isIn(['permanent', 'freelance', 'intern']),
    query('specialization').optional().trim(),
    query('q').optional().trim(),
  ],
  validateRequest,
  listStaffHandler,
);

router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid Staff ID')],
  validateRequest,
  getStaffHandler,
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('locality').trim().notEmpty().withMessage('Locality is required'),
    body('employmentType').isIn(['permanent', 'freelance', 'intern']).withMessage('Invalid employment type'),
    body('specializations').isArray({ min: 1 }).withMessage('At least one specialization is required'),
    body('salaryType').optional().isIn(['monthly', 'piece-rate', 'freelance', 'other']),
    body('salaryAmount').optional().isFloat({ min: 0 }).withMessage('Salary amount must be a positive number'),
    body('joiningDate').optional().isISO8601().withMessage('Joining date must be ISO8601 format'),
  ],
  validateRequest,
  createStaffHandler,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Staff ID'),
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('locality').optional().trim().notEmpty().withMessage('Locality cannot be empty'),
    body('employmentType').optional().isIn(['permanent', 'freelance', 'intern']),
    body('specializations').optional().isArray({ min: 1 }),
    body('salaryType').optional().isIn(['monthly', 'piece-rate', 'freelance', 'other']),
    body('salaryAmount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validateRequest,
  updateStaffHandler,
);

router.post(
  '/:id/performance-notes',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid Staff ID'),
    body('body').trim().notEmpty().withMessage('Note content is required'),
  ],
  validateRequest,
  addPerformanceNoteHandler,
);

export default router;
