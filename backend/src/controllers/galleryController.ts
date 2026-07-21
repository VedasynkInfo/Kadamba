import type { Request, Response } from 'express';
import {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItem,
  listGalleryItems,
  updateGalleryItem,
} from '../services/galleryService';
import { isAdminRequest } from '../middleware/optionalAuth';
import { asyncHandler } from '../utils/asyncHandler';

export const listGallery = asyncHandler(async (req: Request, res: Response) => {
  const data = await listGalleryItems(req.query as Record<string, unknown>, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Gallery items', data });
});

export const getGallery = asyncHandler(async (req: Request, res: Response) => {
  const item = await getGalleryItem(req.params.idOrSlug as string, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Gallery item', data: item });
});

export const createGallery = asyncHandler(async (req: Request, res: Response) => {
  const item = await createGalleryItem(req.body);
  res.status(201).json({ success: true, message: 'Gallery item created', data: item });
});

export const updateGallery = asyncHandler(async (req: Request, res: Response) => {
  const item = await updateGalleryItem(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: 'Gallery item updated', data: item });
});

export const removeGallery = asyncHandler(async (req: Request, res: Response) => {
  const item = await deleteGalleryItem(req.params.id as string);
  res.status(200).json({ success: true, message: 'Gallery item deleted', data: item });
});
