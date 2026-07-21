import mongoose from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import {
  Lead,
  LEAD_STATUSES,
  type ILead,
  type LeadSource,
  type LeadStatus,
} from '../models/Lead';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { searchRegex } from '../utils/query';
import { toDto } from '../utils/serialize';

export interface CreateLeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  occasion: string;
  budget: string;
  preferredDate: string;
  message: string;
  inspirationFiles?: Express.Multer.File[];
}

export type LeadDto = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  occasion: string;
  budget: string;
  preferredDate: string;
  message: string;
  inspirationImages?: string[];
  status: LeadStatus;
  source: LeadSource;
  assignee: string;
  notes: Array<{ id: string; body: string; author: string; createdAt: string }>;
  timeline: Array<{
    id: string;
    type: string;
    label: string;
    detail?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

function cloudinaryConfigured(): boolean {
  return Boolean(
    env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
  );
}

async function uploadInspirationBuffers(
  files: Express.Multer.File[],
): Promise<string[]> {
  if (!files.length) return [];
  if (!cloudinaryConfigured()) {
    console.warn('Cloudinary not configured — skipping inspiration image upload');
    return [];
  }

  const urls: string[] = [];
  for (const file of files) {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'kadamba-leads',
          resource_type: 'image',
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        },
        (error, uploaded) => {
          if (error || !uploaded?.secure_url) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secure_url: uploaded.secure_url });
        },
      );
      stream.end(file.buffer);
    });
    urls.push(result.secure_url);
  }
  return urls;
}

function serializeLead(doc: ILead | Record<string, unknown>): LeadDto {
  const raw = toDto<Record<string, unknown>>(doc);
  const notes = Array.isArray(raw.notes)
    ? (raw.notes as Array<Record<string, unknown>>).map((n) => ({
        id: String(n.id ?? n._id ?? ''),
        body: String(n.body ?? ''),
        author: String(n.author ?? ''),
        createdAt: String(n.createdAt ?? ''),
      }))
    : [];
  const timeline = Array.isArray(raw.timeline)
    ? (raw.timeline as Array<Record<string, unknown>>).map((t) => ({
        id: String(t.id ?? t._id ?? ''),
        type: String(t.type ?? ''),
        label: String(t.label ?? ''),
        detail: t.detail ? String(t.detail) : undefined,
        createdAt: String(t.createdAt ?? ''),
      }))
    : [];

  let preferredDate = String(raw.preferredDate ?? '');
  if (preferredDate.includes('T')) preferredDate = preferredDate.slice(0, 10);

  return {
    id: String(raw.id),
    name: String(raw.name),
    phone: String(raw.phone),
    email: String(raw.email),
    city: String(raw.city),
    service: String(raw.service),
    occasion: String(raw.occasion),
    budget: String(raw.budget),
    preferredDate,
    message: String(raw.message),
    inspirationImages: Array.isArray(raw.inspirationImages)
      ? (raw.inspirationImages as string[])
      : [],
    status: raw.status as LeadStatus,
    source: raw.source as LeadSource,
    assignee: String(raw.assignee ?? 'Unassigned'),
    notes,
    timeline,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

/**
 * Create a CRM lead from the public request-service form.
 */
export async function createLeadFromRequest(input: CreateLeadInput): Promise<ILead> {
  const inspirationImages = await uploadInspirationBuffers(input.inspirationFiles ?? []);

  const lead = await Lead.create({
    name: input.name,
    phone: input.phone,
    email: input.email,
    city: input.city,
    service: input.service,
    occasion: input.occasion,
    budget: input.budget,
    preferredDate: new Date(input.preferredDate),
    message: input.message,
    inspirationImages,
    status: 'New',
    source: 'Request Service',
    assignee: 'Unassigned',
    notes: [],
    timeline: [
      {
        type: 'created',
        label: 'Lead created',
        detail: 'From request-service form',
        createdAt: new Date(),
      },
    ],
  });

  return lead;
}

export async function listLeads(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};

  if (typeof query.status === 'string' && query.status && query.status !== 'All') {
    if (!(LEAD_STATUSES as readonly string[]).includes(query.status)) {
      throw new ApiError(400, 'Invalid status filter');
    }
    filter.status = query.status;
  }

  if (typeof query.source === 'string' && query.source) {
    filter.source = query.source;
  }

  if (typeof query.assignee === 'string' && query.assignee) {
    filter.assignee = query.assignee;
  }

  const q = searchRegex(typeof query.q === 'string' ? query.q : undefined);
  if (q) {
    filter.$or = [{ name: q }, { email: q }, { phone: q }, { city: q }, { service: q }];
  }

  const [docs, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serializeLead(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getLeadById(id: string): Promise<LeadDto> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid lead id');
  const doc = await Lead.findById(id).lean();
  if (!doc) throw new ApiError(404, 'Lead not found');
  return serializeLead(doc);
}

export async function updateLead(
  id: string,
  input: { status?: LeadStatus; assignee?: string },
): Promise<LeadDto> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid lead id');
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');

  if (input.status && input.status !== lead.status) {
    if (!(LEAD_STATUSES as readonly string[]).includes(input.status)) {
      throw new ApiError(400, 'Invalid status');
    }
    lead.timeline.push({
      type: 'status',
      label: `Status → ${input.status}`,
      createdAt: new Date(),
    });
    lead.status = input.status;
  }

  if (input.assignee !== undefined && input.assignee !== lead.assignee) {
    lead.timeline.push({
      type: 'assigned',
      label: `Assigned to ${input.assignee}`,
      createdAt: new Date(),
    });
    lead.assignee = input.assignee;
  }

  await lead.save();
  return serializeLead(lead);
}

export async function addLeadNote(
  id: string,
  body: string,
  author: string,
): Promise<LeadDto> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid lead id');
  const trimmed = body.trim();
  if (!trimmed) throw new ApiError(400, 'Note body is required');

  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');

  lead.notes.push({
    body: trimmed,
    author: author.trim() || 'Studio Lead',
    createdAt: new Date(),
  });
  lead.timeline.push({
    type: 'note',
    label: 'Note added',
    detail: trimmed.slice(0, 80),
    createdAt: new Date(),
  });

  await lead.save();
  return serializeLead(lead);
}

export async function exportLeadsCsv(query: Record<string, unknown>): Promise<string> {
  const filter: Record<string, unknown> = {};
  if (typeof query.status === 'string' && query.status && query.status !== 'All') {
    filter.status = query.status;
  }
  const docs = await Lead.find(filter).sort({ createdAt: -1 }).lean();
  const header = [
    'id',
    'name',
    'phone',
    'email',
    'city',
    'service',
    'occasion',
    'budget',
    'preferredDate',
    'status',
    'source',
    'assignee',
    'createdAt',
  ];

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = docs.map((d) => {
    const lead = serializeLead(d);
    return [
      lead.id,
      lead.name,
      lead.phone,
      lead.email,
      lead.city,
      lead.service,
      lead.occasion,
      lead.budget,
      lead.preferredDate,
      lead.status,
      lead.source,
      lead.assignee,
      lead.createdAt,
    ]
      .map((c) => escape(String(c)))
      .join(',');
  });

  return [header.join(','), ...rows].join('\n');
}

export { serializeLead };
