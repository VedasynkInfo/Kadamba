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

export const listOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listOrders(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Orders', data });
});

export const getOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await getOrderById(req.params.id);
  res.status(200).json({ success: true, message: 'Order details', data: order });
});

export const createOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const order = await createOrder({
    ...req.body,
    actorId,
  });
  res.status(201).json({ success: true, message: 'Order created successfully', data: order });
});

export const updateOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await updateOrder(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
});

export const transitionOrderStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const { status, note } = req.body as { status: OrderStatus; note?: string };
  const order = await transitionOrderStatus(req.params.id, status, actorId, note);

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
    // Fire-and-forget email + portal invite; do not block status response.
    void notifyOrderConfirmed(order.id).catch((err) => {
      console.warn('notifyOrderConfirmed failed', err);
    });
  }

  res.status(200).json({ success: true, message: 'Status transitioned successfully', data: order });
});

export const assignStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await assignStaff(req.params.id, req.body.assignedStaff);
  res.status(200).json({ success: true, message: 'Staff assigned successfully', data: order });
});

export const linkMeasurementProfilesHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await linkMeasurementProfiles(req.params.id, req.body.measurementProfileIds);
  res.status(200).json({ success: true, message: 'Measurement profiles linked successfully', data: order });
});

export const addOrderNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const { body, visibility } = req.body as { body: string; visibility: 'internal' | 'customer' };
  const order = await addOrderNote(req.params.id, body, visibility || 'internal', actorId);
  res.status(201).json({ success: true, message: 'Note added successfully', data: order });
});

export const convertLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user?.id || 'Studio Admin';
  const order = await convertLeadToOrder(req.params.leadId, actorId);
  res.status(201).json({ success: true, message: 'Lead converted to order successfully', data: order });
});

