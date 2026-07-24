import type { Request, Response } from 'express';
import {
  adminListPortalChat,
  adminReplyPortalChat,
  approveMeasurementProfile,
  createPortalRequest,
  getPortalDashboard,
  getPortalOrder,
  listPortalCatalog,
  listPortalChat,
  listPortalMeasurements,
  listPortalOrders,
  listPortalPayments,
  getPortalInvoice,
  loginPortal,
  postPortalChat,
  setPortalPassword,
  submitPortalMeasurement,
  verifyPortalActivation,
  getPortalMeasurementTemplate,
  listPortalMeasurementTemplates,
} from '../services/portalService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

function customerIdFromReq(req: Request): string {
  const id = req.user?.customerId;
  if (!id) throw new ApiError(403, 'Customer portal access required');
  return id;
}

export const verifyActivateHandler = asyncHandler(async (req: Request, res: Response) => {
  const { referenceId, emailOrMobile } = req.body as {
    referenceId?: string;
    emailOrMobile?: string;
  };
  const data = await verifyPortalActivation({
    referenceId: referenceId || '',
    emailOrMobile: emailOrMobile || '',
  });
  res.status(200).json({ success: true, message: 'Verified', data });
});

export const setPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { activationToken, password, confirmPassword } = req.body as {
    activationToken?: string;
    password?: string;
    confirmPassword?: string;
  };
  const data = await setPortalPassword({
    activationToken: activationToken || '',
    password: password || '',
    confirmPassword: confirmPassword || '',
  });
  res.status(200).json({ success: true, message: 'Portal activated', data });
});

export const portalLoginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const data = await loginPortal({
    email: (email || '').trim(),
    password: password || '',
  });
  res.status(200).json({ success: true, message: 'Signed in', data });
});

export const portalDashboardHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getPortalDashboard(customerIdFromReq(req));
  res.status(200).json({ success: true, message: 'Dashboard', data });
});

export const portalOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPortalOrders(customerIdFromReq(req));
  res.status(200).json({ success: true, message: 'Orders', data });
});

export const portalOrderDetailHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getPortalOrder(customerIdFromReq(req), String(req.params.id));
  res.status(200).json({ success: true, message: 'Order', data });
});

export const portalMeasurementsListHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPortalMeasurements(customerIdFromReq(req));
  res.status(200).json({ success: true, message: 'Measurements', data });
});

export const portalMeasurementTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getPortalMeasurementTemplate(String(req.params.code));
  res.status(200).json({ success: true, message: 'Template', data });
});

export const portalMeasurementTemplatesListHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPortalMeasurementTemplates();
  res.status(200).json({ success: true, message: 'Templates', data });
});

export const portalMeasurementsSubmitHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await submitPortalMeasurement(
    customerIdFromReq(req),
    req.body,
    req.user?.id || 'customer',
  );
  res.status(201).json({ success: true, message: 'Measurement request submitted', data });
});

export const portalChatListHandler = asyncHandler(async (req: Request, res: Response) => {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  const data = await listPortalChat(customerIdFromReq(req), orderId);
  res.status(200).json({ success: true, message: 'Chat', data });
});

export const portalChatPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await postPortalChat(
    customerIdFromReq(req),
    req.body,
    req.user?.id || 'customer',
  );
  res.status(201).json({ success: true, message: 'Message sent', data });
});

export const portalPaymentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPortalPayments(customerIdFromReq(req));
  res.status(200).json({ success: true, message: 'Payments', data });
});

export const portalInvoiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getPortalInvoice(customerIdFromReq(req), String(req.params.id));
  res.status(200).json({ success: true, message: 'Invoice', data });
});

export const portalCatalogHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPortalCatalog();
  res.status(200).json({ success: true, message: 'Catalog', data });
});

export const portalRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createPortalRequest(customerIdFromReq(req), req.body);
  res.status(201).json({ success: true, message: 'Request submitted', data });
});

export const adminPortalChatListHandler = asyncHandler(async (req: Request, res: Response) => {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  const data = await adminListPortalChat(String(req.params.customerId), orderId);
  res.status(200).json({ success: true, message: 'Chat', data });
});

export const adminPortalChatReplyHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminReplyPortalChat({
    customerId: String(req.params.customerId),
    orderId: req.body.orderId,
    body: req.body.body,
    attachments: req.body.attachments,
    senderId: req.user?.id || 'admin',
    senderRole: 'admin',
  });
  res.status(201).json({ success: true, message: 'Reply sent', data });
});

export const approveMeasurementHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await approveMeasurementProfile(String(req.params.id));
  res.status(200).json({ success: true, message: 'Measurement approved', data });
});
