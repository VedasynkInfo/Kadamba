import type { Request, Response } from 'express';
import {
  createStaff,
  getStaffById,
  updateStaff,
  listStaff,
  addPerformanceNote,
} from '../services/staffService';
import { asyncHandler } from '../utils/asyncHandler';

export const createStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const staff = await createStaff(req.body);
  res.status(201).json({ success: true, message: 'Staff profile created successfully', data: staff });
});

export const getStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const staff = await getStaffById(String(req.params.id));
  res.status(200).json({ success: true, message: 'Staff profile details', data: staff });
});

export const updateStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const staff = await updateStaff(String(req.params.id), req.body);
  res.status(200).json({ success: true, message: 'Staff profile updated successfully', data: staff });
});

export const listStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listStaff(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Staff list', data });
});

export const addPerformanceNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.body as { body: string };
  const staff = await addPerformanceNote(String(req.params.id), body);
  res.status(200).json({ success: true, message: 'Performance note added', data: staff });
});
