import type { Request, Response } from 'express';
import {
  createPortfolio,
  deletePortfolio,
  getPortfolio,
  listPortfolio,
  updatePortfolio,
} from '../services/portfolioService';
import { isAdminRequest } from '../middleware/optionalAuth';
import { asyncHandler } from '../utils/asyncHandler';

export const listPortfolioHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPortfolio(req.query as Record<string, unknown>, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Portfolio projects', data });
});

export const getPortfolioHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await getPortfolio(req.params.idOrSlug as string, {
    admin: isAdminRequest(req),
  });
  res.status(200).json({ success: true, message: 'Portfolio project', data: item });
});

export const createPortfolioHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await createPortfolio(req.body);
  res.status(201).json({ success: true, message: 'Portfolio project created', data: item });
});

export const updatePortfolioHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await updatePortfolio(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: 'Portfolio project updated', data: item });
});

export const removePortfolioHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await deletePortfolio(req.params.id as string);
  res.status(200).json({ success: true, message: 'Portfolio project deleted', data: item });
});
