import type { Request, Response } from 'express';
import {
  createService,
  deleteService,
  getService,
  listServices,
  updateService,
} from '../services/serviceService';
import { isAdminRequest } from '../middleware/optionalAuth';
import { asyncHandler } from '../utils/asyncHandler';

export const listServicesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listServices(req.query as Record<string, unknown>, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Services', data });
});

export const getServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await getService(req.params.idOrSlug as string, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Service', data: item });
});

export const createServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await createService(req.body);
  res.status(201).json({ success: true, message: 'Service created', data: item });
});

export const updateServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await updateService(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: 'Service updated', data: item });
});

export const removeServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await deleteService(req.params.id as string);
  res.status(200).json({ success: true, message: 'Service deleted', data: item });
});
