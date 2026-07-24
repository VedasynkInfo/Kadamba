import type { Request, Response } from 'express';
import { getDashboardSummary } from '../services/dashboardService';
import { getAdminBadgeCounts } from '../services/notificationService';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * GET /api/admin/dashboard/summary
 * Fetch primary metrics and trend graphs for the boutique console.
 */
export const getDashboardSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  
  const summary = await getDashboardSummary(from, to);
  
  res.status(200).json({
    success: true,
    message: 'Dashboard summary retrieved successfully',
    data: summary,
  });
});

/**
 * GET /api/admin/dashboard/badges
 * Nav badge counts (leads / pending measurements / unread chat).
 */
export const getDashboardBadgesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAdminBadgeCounts();
  res.status(200).json({
    success: true,
    message: 'Badge counts',
    data,
  });
});
