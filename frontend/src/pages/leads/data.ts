import { brand } from '@/pages/home/data';

export { brand };

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Appointment',
  'Completed',
  'Rejected',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadSource = 'Request Service' | 'Contact' | 'WhatsApp' | 'Walk-in' | 'Referral';

export interface LeadNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface LeadTimelineEvent {
  id: string;
  type: 'created' | 'status' | 'note' | 'assigned' | 'export';
  label: string;
  detail?: string;
  createdAt: string;
}

export interface LeadFollowUp {
  id: string;
  scheduledAt: string;
  type: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
  notes: string;
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  completedAt?: string;
  outcome?: string;
  createdBy?: string;
}

/**
 * CRUD-ready lead record — maps to Mongo Lead model.
 */
export interface Lead {
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
  status: LeadStatus;
  source: LeadSource;
  assignee: string;
  orderId?: string;
  orderNumber?: number;
  referenceId?: string;
  notes: LeadNote[];
  timeline: LeadTimelineEvent[];
  score?: number;
  quality?: 'hot' | 'warm' | 'cold';
  scoreBreakdown?: {
    budgetScore: number;
    timelineScore: number;
    serviceScore: number;
    detailsScore: number;
    contactScore: number;
  };
  followUps?: LeadFollowUp[];
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const leadAssignees = ['Unassigned', 'Studio Lead', 'Bridal Desk', 'Fitting Desk'] as const;

export const leadsBanner = {
  brandName: brand.shortName,
  locationLine: `${brand.location} · Studio CRM`,
  headline: 'Leads in one atelier desk',
  copy: 'Track bridal and traditional enquiries from first message to completed fitting.',
  image:
    '/media/placeholders/fabric.jpg',
  alt: 'Fabric and atelier tools on a studio worktable',
} as const;

export function statusTone(status: LeadStatus): string {
  switch (status) {
    case 'New':
      return 'border-gold/50 bg-gold/15 text-ink';
    case 'Contacted':
      return 'border-line bg-black/[0.04] text-ink';
    case 'Qualified':
      return 'border-line-strong bg-black text-ink-inverse';
    case 'Appointment':
      return 'border-gold bg-gold text-ink';
    case 'Completed':
      return 'border-line bg-surface-sunken text-ink/70';
    case 'Rejected':
      return 'border-line bg-transparent text-ink/45';
    default:
      return 'border-line text-ink';
  }
}

export function formatLeadDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function countByStatus(leads: Lead[]): Record<LeadStatus, number> {
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<
    LeadStatus,
    number
  >;
  for (const lead of leads) {
    counts[lead.status] += 1;
  }
  return counts;
}

export function filterLeads(
  leads: Lead[],
  query: string,
  status: LeadStatus | 'All',
  assignee: string | 'All',
): Lead[] {
  const q = query.trim().toLowerCase();
  return leads
    .filter((lead) => {
      if (status !== 'All' && lead.status !== status) return false;
      if (assignee !== 'All' && lead.assignee !== assignee) return false;
      if (!q) return true;
      const hay = [
        lead.name,
        lead.email,
        lead.phone,
        lead.city,
        lead.service,
        lead.occasion,
        lead.source,
        lead.message,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function leadsToCsv(leads: Lead[]): string {
  const headers = [
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
    'updatedAt',
    'message',
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = leads.map((lead) =>
    [
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
      lead.updatedAt,
      lead.message,
    ]
      .map((cell) => escape(String(cell)))
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
