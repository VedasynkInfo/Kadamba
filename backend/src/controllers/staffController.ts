import type { Request, Response } from 'express';
import {
  createStaff,
  getStaffById,
  updateStaff,
  listStaff,
  addPerformanceNote,
  provisionStaffLogin,
} from '../services/staffService';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAudit, actorFromRequest } from '../services/auditService';

export const createStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const staff = await createStaff(req.body);
  await recordAudit(
    {
      action: 'staff.created',
      actor: actorFromRequest(req),
      entityType: 'staff',
      entityId: staff.id,
      summary: `Created staff profile for ${staff.fullName}`,
      changes: { phone: staff.phone, employmentType: staff.employmentType },
    },
    req,
  );
  res.status(201).json({ success: true, message: 'Staff profile created successfully', data: staff });
});

export const provisionLoginHandler = asyncHandler(async (req: Request, res: Response) => {
  const staffId = String(req.params.id);
  const result = await provisionStaffLogin(staffId, {
    email: req.body?.email,
    permissions: req.body?.permissions,
  });

  await recordAudit(
    {
      action: 'user.created',
      actor: actorFromRequest(req),
      entityType: 'staff',
      entityId: staffId,
      summary: `Provisioned a console login for ${result.email}`,
      changes: { userId: result.userId, permissions: req.body?.permissions },
    },
    req,
  );

  res.status(201).json({
    success: true,
    message: 'Staff login provisioned. Share the setup link with the staff member.',
    data: result,
  });
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
