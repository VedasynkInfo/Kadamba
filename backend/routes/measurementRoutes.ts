import { Router } from 'express';
import { authenticate, authorize } from '../src/middleware/auth';
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
} from '../src/controllers/measurementController';

// ── Templates router — mounted at /measurement-templates ──
export const templatesRouter = Router();
templatesRouter.use(authenticate, authorize('admin'));
templatesRouter.get('/', listTemplatesHandler);
templatesRouter.get('/:code', getTemplateHandler);
templatesRouter.post('/', createTemplateHandler);
templatesRouter.put('/:code', updateTemplateHandler);
templatesRouter.patch('/:code/archive', archiveTemplateHandler);
templatesRouter.post('/seed', seedTemplatesHandler);

// ── Profiles router — mounted at /measurements ──
export const profilesRouter = Router();
profilesRouter.use(authenticate, authorize('admin'));
profilesRouter.get('/', listProfilesHandler);
profilesRouter.post('/', createProfileHandler);
profilesRouter.post('/seed', seedDataHandler);
profilesRouter.get('/:id/history', getProfileHistoryHandler);
profilesRouter.post('/:id/duplicate', duplicateProfileHandler);
profilesRouter.patch('/:id/archive', archiveProfileHandler);
profilesRouter.put('/:id', updateProfileHandler);
profilesRouter.get('/:id', getProfileHandler);