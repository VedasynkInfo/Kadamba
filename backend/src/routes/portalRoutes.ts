import { Router } from 'express';
import { authenticate, authorize, requireCustomer } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import {
  portalCatalogHandler,
  portalChatListHandler,
  portalChatPostHandler,
  portalDashboardHandler,
  portalLoginHandler,
  portalMeasurementsListHandler,
  portalMeasurementsSubmitHandler,
  portalMeasurementTemplateHandler,
  portalMeasurementTemplatesListHandler,
  portalOrderDetailHandler,
  portalOrdersHandler,
  portalPaymentsHandler,
  portalInvoiceHandler,
  portalRequestHandler,
  setPasswordHandler,
  verifyActivateHandler,
  adminPortalChatListHandler,
  adminPortalChatReplyHandler,
  approveMeasurementHandler,
} from '../controllers/portalController';

const router = Router();

/** Public activation + login (rate-limited). */
router.post('/activate/verify', authRateLimiter, verifyActivateHandler);
router.post('/activate/set-password', authRateLimiter, setPasswordHandler);
router.post('/login', authRateLimiter, portalLoginHandler);

/** Public catalog browse (active products only). */
router.get('/catalog', portalCatalogHandler);

/** Authenticated customer portal. */
const customerRouter = Router();
customerRouter.use(authenticate, requireCustomer);
customerRouter.get('/dashboard', portalDashboardHandler);
customerRouter.get('/orders', portalOrdersHandler);
customerRouter.get('/orders/:id', portalOrderDetailHandler);
customerRouter.get('/measurements', portalMeasurementsListHandler);
customerRouter.get('/measurement-templates', portalMeasurementTemplatesListHandler);
customerRouter.get('/measurement-templates/:code', portalMeasurementTemplateHandler);
customerRouter.post('/measurements', portalMeasurementsSubmitHandler);
customerRouter.get('/chat', portalChatListHandler);
customerRouter.post('/chat', portalChatPostHandler);
customerRouter.get('/payments', portalPaymentsHandler);
customerRouter.get('/invoices/:id', portalInvoiceHandler);
customerRouter.post('/requests', portalRequestHandler);
router.use(customerRouter);

export default router;

/**
 * Admin extras for portal chat + measurement approval.
 * Mounted at /api/admin/portal so it does not intercept other /admin routes.
 */
export const adminPortalExtrasRouter = Router();
adminPortalExtrasRouter.use(authenticate, authorize('admin'));
adminPortalExtrasRouter.get('/customers/:customerId/chat', adminPortalChatListHandler);
adminPortalExtrasRouter.post('/customers/:customerId/chat', adminPortalChatReplyHandler);
adminPortalExtrasRouter.patch('/measurements/:id/approve', approveMeasurementHandler);
