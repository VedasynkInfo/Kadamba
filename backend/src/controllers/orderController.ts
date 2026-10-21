import type { Request, Response } from 'express';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrder,
  transitionOrderStatus,
  assignStaff,
  linkMeasurementProfiles,
  addOrderNote,
  convertLeadToOrder,
} from '../services/orderService';
import { asyncHandler } from '../utils/asyncHandler';
import { OrderStatus } from '../models/Order';
import { recordAudit, actorFromRequest } from '../services/auditService';

export const listOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listOrders(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Orders', data });
});

export const getOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await getOrderById(String(req.params.id));
  res.status(200).json({ success: true, message: 'Order details', data: order });
});

export const createOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const order = await createOrder({
    ...req.body,
    actorId,
  });

  await recordAudit(
    {
      action: 'order.created',
      actor: actorFromRequest(req),
      entityType: 'order',
      entityId: order.id,
      summary: `Created order ${order.referenceId ?? order.id}`,
      changes: { title: order.title, totalQuoted: order.paymentSummary?.totalQuoted },
    },
    req,
  );

  res.status(201).json({ success: true, message: 'Order created successfully', data: order });
});

export const updateOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await updateOrder(String(req.params.id), req.body);
  res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
});

export const transitionOrderStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const { status, note } = req.body as { status: OrderStatus; note?: string };
  const order = await transitionOrderStatus(String(req.params.id), status, actorId, note);

  const { notifyOrderStatusChanged } = await import('../services/notificationService');
  notifyOrderStatusChanged({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: String(order.customerId?.id || order.customerId),
    status,
    referenceId: order.referenceId,
    title: order.title,
  });

  if (status === 'confirmed' && order.referenceId) {
    const { notifyOrderConfirmed } = await import('../services/portalService');
    // Awaited: the confirmation email is queued in the durable outbox, and
    // that row must exist before the response is sent.
    await notifyOrderConfirmed(order.id).catch((err) => {
      console.warn('notifyOrderConfirmed failed', err);
    });
  }

  await recordAudit(
    {
      action: 'order.status_changed',
      actor: actorFromRequest(req),
      entityType: 'order',
      entityId: order.id,
      summary: `Order ${order.referenceId ?? order.id} moved to ${status}`,
      changes: { status, note },
    },
    req,
  );

  res.status(200).json({ success: true, message: 'Status transitioned successfully', data: order });
});

export const assignStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await assignStaff(String(req.params.id), req.body.assignedStaff);
  res.status(200).json({ success: true, message: 'Staff assigned successfully', data: order });
});

export const linkMeasurementProfilesHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await linkMeasurementProfiles(String(req.params.id), req.body.measurementProfileIds);
  res.status(200).json({ success: true, message: 'Measurement profiles linked successfully', data: order });
});

export const addOrderNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const { body, visibility } = req.body as { body: string; visibility: 'internal' | 'customer' };
  const order = await addOrderNote(String(req.params.id), body, visibility || 'internal', actorId);
  res.status(201).json({ success: true, message: 'Note added successfully', data: order });
});

export const convertLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const order = await convertLeadToOrder(String(req.params.leadId), actorId);
  res.status(201).json({ success: true, message: 'Lead converted to order successfully', data: order });
});

