import type { Request, Response } from 'express';
import { sendEmail } from '../config/email';
import { env } from '../config/env';
import {
  addLeadNote,
  createLeadFromRequest,
  exportLeadsCsv,
  getLeadById,
  listLeads,
  updateLead,
} from '../services/leadService';
import { asyncHandler } from '../utils/asyncHandler';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Public request-service form — persists a CRM lead and emails the studio.
 */
export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    phone,
    email,
    city,
    service,
    occasion,
    budget,
    preferredDate,
    message,
  } = req.body as {
    name: string;
    phone: string;
    email: string;
    city: string;
    service: string;
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
    service,
    occasion,
    budget,
    preferredDate,
    message,
    inspirationFiles: files,
  });

  const to = env.email.to || env.email.user;
  const safeName = escapeHtml(name);
  const imageList =
    lead.inspirationImages.length > 0
      ? lead.inspirationImages.map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`).join('')
      : '<li>None</li>';

  const leadId = String(lead._id);

  if (!to) {
    console.warn('Lead created — EMAIL_TO / EMAIL_USER not set; skipping outbound mail');
    console.info({
      id: leadId,
      name,
      email,
      phone,
      service,
      occasion,
    });
  } else {
    await sendEmail({
      to,
      subject: `New service request — ${name}`,
      text: [
        `New lead from request-service`,
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email}`,
        `City: ${city}`,
        `Service: ${service}`,
        `Occasion: ${occasion}`,
        `Budget: ${budget}`,
        `Preferred date: ${preferredDate}`,
        `Message: ${message}`,
        `Inspiration: ${lead.inspirationImages.join(', ') || 'None'}`,
        `Lead ID: ${leadId}`,
      ].join('\n'),
      html: `
      <h2>New service request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>City:</strong> ${escapeHtml(city)}</p>
      <p><strong>Service:</strong> ${escapeHtml(service)}</p>
      <p><strong>Occasion:</strong> ${escapeHtml(occasion)}</p>
      <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
      <p><strong>Preferred date:</strong> ${escapeHtml(preferredDate)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
      <p><strong>Inspiration images:</strong></p>
      <ul>${imageList}</ul>
      <p><strong>Lead ID:</strong> ${escapeHtml(leadId)}</p>
    `,
    });

    await sendEmail({
      to: email,
      subject: "We received your consultation request — Kadamba's Designer Studio",
      text: `Hi ${name},\n\nThank you for requesting a consultation with Kadamba's Designer Studio in Kurnool. We will review your details and get back to you shortly.\n\n— Kadamba's Designer Studio`,
      html: `
      <p>Hi ${safeName},</p>
      <p>Thank you for requesting a consultation with <strong>Kadamba's Designer Studio</strong> in Kurnool. We will review your details and get back to you shortly.</p>
      <p>— Kadamba's Designer Studio</p>
    `,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Service request submitted successfully',
    data: {
      id: leadId,
      status: lead.status,
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
