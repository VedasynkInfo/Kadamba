import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  archiveTemplate,
  seedTemplates,
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  archiveProfile,
  duplicateProfile,
  getProfileHistory,
  seedProfiles,
} from '../services/measurementService';

export const listTemplatesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listTemplates(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Measurement templates', data });
});

export const getTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const template = await getTemplate(req.params.code as string);
  res.status(200).json({ success: true, message: 'Measurement template', data: template });
});

export const createTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user?.id as string;
  const template = await createTemplate(req.body, actor);
  res.status(201).json({ success: true, message: 'Measurement template created', data: template });
});

export const updateTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user?.id as string;
  const template = await updateTemplate(req.params.code as string, req.body, actor);
  res.status(200).json({ success: true, message: 'Measurement template updated', data: template });
});

export const archiveTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };
  const template = await archiveTemplate(req.params.code as string, active);
  res.status(200).json({ success: true, message: 'Measurement template archived', data: template });
});

export const seedTemplatesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await seedTemplates();
  res.status(200).json({ success: true, message: 'Template seeding completed', data: result });
});

export const listProfilesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listProfiles(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Measurement profiles', data });
});

export const getProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getProfile(req.params.id as string);
  res.status(200).json({ success: true, message: 'Measurement profile', data: profile });
});

export const createProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user?.id as string;
  const profile = await createProfile(req.body, actor);
  res.status(201).json({ success: true, message: 'Measurement profile created', data: profile });
});

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user?.id as string;
  const profile = await updateProfile(req.params.id as string, req.body, actor);
  res.status(200).json({ success: true, message: 'Measurement profile updated', data: profile });
});

export const archiveProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const { archive } = req.body as { archive: boolean };
  const profile = await archiveProfile(req.params.id as string, archive);
  res.status(200).json({ success: true, message: 'Measurement profile archived', data: profile });
});

export const duplicateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user?.id as string;
  const profile = await duplicateProfile(req.params.id as string, actor);
  res.status(201).json({ success: true, message: 'Measurement profile duplicated', data: profile });
});

export const getProfileHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getProfileHistory(req.params.id as string);
  res.status(200).json({ success: true, message: 'Measurement profile history', data });
});

export const seedDataHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await seedProfiles();
  res.status(200).json({ success: true, message: 'Measurement data seeding completed', data: result });
});