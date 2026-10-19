import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listUsersHandler,
  permissionCatalogHandler,
  setUserRoleHandler,
  setUserStatusHandler,
} from '../controllers/userAdminController';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

/**
 * Users & Roles desk. Mounted at `/api/admin/users`.
 * All routes require an admin with `users:manage`.
 */
const router = Router();

router.use(authenticate, authorize('admin'), requirePermission('users:manage'));

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['admin', 'staff', 'user']),
    query('status').optional().isIn(['active', 'disabled']),
    query('q').optional().trim(),
  ],
  validateRequest,
  listUsersHandler,
);

router.get('/permissions', permissionCatalogHandler);

router.patch(
  '/:id/status',
  [param('id').isMongoId(), body('status').isIn(['active', 'disabled'])],
  validateRequest,
  setUserStatusHandler,
);

router.patch(
  '/:id/role',
  [param('id').isMongoId(), body('role').isIn(['admin', 'staff', 'user'])],
  validateRequest,
  setUserRoleHandler,
);

export default router;
