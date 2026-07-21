import type { Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/settingsService';
import { asyncHandler } from '../utils/asyncHandler';

export const getSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getSettings();
  res.status(200).json({ success: true, message: 'Website settings', data });
});

export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateSettings(req.body);
  res.status(200).json({ success: true, message: 'Website settings updated', data });
});
