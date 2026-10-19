import { Router } from 'express';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateHandler,
  archiveTemplateHandler,
  seedTemplatesHandler,
  listProfilesHandler,
  getProfileHandler,
  createProfileHandler,
  updateProfileHandler,
  archiveProfileHandler,
  duplicateProfileHandler,
  getProfileHistoryHandler,
  seedDataHandler,
} from '../controllers/measurementController';

// ---- Templates router — mounted at /measurement-templates ----
export const templatesRouter = Router();
templatesRouter.use(authenticate, authorize('admin', 'staff'));

templatesRouter.get('/', requirePermission('measurements:read'), listTemplatesHandler);
templatesRouter.get('/:code', requirePermission('measurements:read'), getTemplateHandler);
templatesRouter.post('/', requirePermission('measurements:write'), createTemplateHandler);
templatesRouter.put('/:code', requirePermission('measurements:write'), updateTemplateHandler);
templatesRouter.patch(
  '/:code/archive',
  requirePermission('measurements:write'),
  archiveTemplateHandler,
);
templatesRouter.post('/seed', requirePermission('measurements:write'), seedTemplatesHandler);

// ---- Profiles router — mounted at /measurements ----
export const profilesRouter = Router();
profilesRouter.use(authenticate, authorize('admin', 'staff'));

profilesRouter.get('/', requirePermission('measurements:read'), listProfilesHandler);
profilesRouter.post('/', requirePermission('measurements:write'), createProfileHandler);
profilesRouter.post('/seed', requirePermission('measurements:write'), seedDataHandler);
profilesRouter.get(
  '/:id/history',
  requirePermission('measurements:read'),
  getProfileHistoryHandler,
);
profilesRouter.post(
  '/:id/duplicate',
  requirePermission('measurements:write'),
  duplicateProfileHandler,
);
profilesRouter.patch(
  '/:id/archive',
  requirePermission('measurements:write'),
  archiveProfileHandler,
);
profilesRouter.put('/:id', requirePermission('measurements:write'), updateProfileHandler);
profilesRouter.get('/:id', requirePermission('measurements:read'), getProfileHandler);
