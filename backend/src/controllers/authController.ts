import type { Request, Response } from 'express';
import {
  getUserById,
  loginUser,
  refreshToken,
  updateProfile,
} from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Current user',
    data: { user },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshToken(req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: result,
  });
});

export const profile = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateProfile(req.user!.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: result,
  });
});
