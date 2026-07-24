import type { Request, Response } from 'express';
import {
  addLeadNote,
  createLeadFromRequest,
  exportLeadsCsv,
  getLeadById,
  listLeads,
  updateLead,
} from '../services/leadService';
import { notifyRequestReceived } from '../services/notificationService';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Public request-service form — persists a CRM lead and notifies studio + customer.
 */
export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    phone,
    email,
    city,
    locality,
    service,
    garmentType,
    fabricStatus,
    occasion,
    budget,
    preferredDate,
    message,
  } = req.body as {
    name: string;
    phone: string;
    email: string;
    city: string;
    locality?: string;
    service: string;
    garmentType?: string;
    fabricStatus?: string;
    occasion: string;
    budget: string;
    preferredDate: string;
    message: string;
  };

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const lead = await createLeadFromRequest({
    name,
    phone,
    email,
    city,
    locality,
    service,
    garmentType,
    fabricStatus,
    occasion,
    budget,
    preferredDate,
    message,
    inspirationFiles: files,
  });

  const leadId = String(lead._id);

  void notifyRequestReceived({
    leadId,
    name,
    phone,
    email,
    service,
    occasion,
    orderId: lead.orderId ? String(lead.orderId) : undefined,
    orderNumber: lead.orderNumber,
    source: 'Request Service',
  }).catch((err) => console.warn('notifyRequestReceived failed', err));

  res.status(201).json({
    success: true,
    message: 'Service request submitted successfully',
    data: {
      id: leadId,
      status: lead.status,
      orderId: lead.orderId ? String(lead.orderId) : undefined,
      orderNumber: lead.orderNumber,
      referenceId: lead.referenceId,
    },
  });
});

export const listLeadsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listLeads(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Leads', data });
});

export const getLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const lead = await getLeadById(req.params.id as string);
  res.status(200).json({ success: true, message: 'Lead', data: lead });
});

export const updateLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const lead = await updateLead(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: 'Lead updated', data: lead });
});

export const addNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const author =
    (req.body.author as string | undefined) ||
    req.user?.id ||
    'Studio Lead';
  const lead = await addLeadNote(req.params.id as string, req.body.body, author);
  res.status(201).json({ success: true, message: 'Note added', data: lead });
});

export const exportLeadsHandler = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportLeadsCsv(req.query as Record<string, unknown>);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kadamba-leads.csv"');
  res.status(200).send(csv);
});
