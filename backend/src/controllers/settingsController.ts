import type { Request, Response } from 'express';
import {
  getAdminSettings,
  getPublicSettings,
  getSettings,
  patchSettings,
  sendTestEmail,
  updateSettings,
} from '../services/settingsService';
import { asyncHandler } from '../utils/asyncHandler';

/** GET /api/settings — public-safe (legacy + primary public fetch) */
export const getSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getSettings();
  res.status(200).json({ success: true, message: 'Website settings', data });
});

/** GET /api/settings/public — explicit public subset */
export const getPublicSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getPublicSettings();
  res.status(200).json({ success: true, message: 'Public website settings', data });
});

/** PUT /api/settings — admin (legacy) */
export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateSettings(req.body);
  res.status(200).json({ success: true, message: 'Website settings updated', data });
});

/** GET /api/admin/settings */
export const getAdminSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAdminSettings();
  res.status(200).json({ success: true, message: 'Admin settings', data });
});

/** PATCH /api/admin/settings */
export const patchSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await patchSettings(req.body);
  res.status(200).json({ success: true, message: 'Settings updated', data });
});

/** PUT /api/admin/settings — full replace */
export const putAdminSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateSettings(req.body);
  res.status(200).json({ success: true, message: 'Website settings updated', data });
});

/** POST /api/admin/settings/test-email */
export const testEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const to = typeof req.body?.to === 'string' ? req.body.to : undefined;
  const data = await sendTestEmail(to);
  res.status(200).json({
    success: true,
    message: `Test email sent to ${data.to}`,
    data,
  });
});
