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

/**
 * CRUD-ready lead record — maps to a future Mongo Lead model (Phase 13).
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
  notes: LeadNote[];
  timeline: LeadTimelineEvent[];
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
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1600&q=80',
  alt: 'Fabric and atelier tools on a studio worktable',
} as const;

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

/** Seed leads until Phase 13 API + Mongo persistence. */
export const seedLeads: Lead[] = [
  {
    id: 'lead-001',
    name: 'Meenakshi Reddy',
    phone: '9876543210',
    email: 'meenakshi@example.com',
    city: 'Kurnool',
    service: 'Bridal Wear',
    occasion: 'Wedding / bridal',
    budget: '₹50,000+',
    preferredDate: '2026-08-12',
    message: 'Looking for a red-and-gold bridal lehenga with three fittings.',
    status: 'Appointment',
    source: 'Request Service',
    assignee: 'Bridal Desk',
    notes: [
      {
        id: 'n1',
        body: 'Prefers lighter embroidery on the blouse for comfort.',
        author: 'Bridal Desk',
        createdAt: isoDaysAgo(2, 14),
      },
    ],
    timeline: [
      {
        id: 't1',
        type: 'created',
        label: 'Lead created',
        detail: 'From request-service form',
        createdAt: isoDaysAgo(8, 9),
      },
      {
        id: 't2',
        type: 'status',
        label: 'Status → Contacted',
        createdAt: isoDaysAgo(7, 11),
      },
      {
        id: 't3',
        type: 'status',
        label: 'Status → Qualified',
        createdAt: isoDaysAgo(5, 16),
      },
      {
        id: 't4',
        type: 'status',
        label: 'Status → Appointment',
        detail: 'Fitting booked for weekend',
        createdAt: isoDaysAgo(3, 10),
      },
      {
        id: 't5',
        type: 'note',
        label: 'Note added',
        createdAt: isoDaysAgo(2, 14),
      },
    ],
    createdAt: isoDaysAgo(8, 9),
    updatedAt: isoDaysAgo(2, 14),
  },
  {
    id: 'lead-002',
    name: 'Ananya Sharma',
    phone: '9123456780',
    email: 'ananya@example.com',
    city: 'Kurnool',
    service: 'Custom Tailoring',
    occasion: 'Engagement',
    budget: '₹25,000 – ₹50,000',
    preferredDate: '2026-07-28',
    message: 'Need silhouette correction on a ready-made lehenga.',
    status: 'Qualified',
    source: 'WhatsApp',
    assignee: 'Fitting Desk',
    notes: [],
    timeline: [
      {
        id: 't1',
        type: 'created',
        label: 'Lead created',
        detail: 'WhatsApp enquiry',
        createdAt: isoDaysAgo(4, 18),
      },
      {
        id: 't2',
        type: 'status',
        label: 'Status → Contacted',
        createdAt: isoDaysAgo(4, 19),
      },
      {
        id: 't3',
        type: 'status',
        label: 'Status → Qualified',
        createdAt: isoDaysAgo(1, 12),
      },
    ],
    createdAt: isoDaysAgo(4, 18),
    updatedAt: isoDaysAgo(1, 12),
  },
  {
    id: 'lead-003',
    name: 'Priya Kumar',
    phone: '9988776655',
    email: 'priya.k@example.com',
    city: 'Nandyal',
    service: 'Traditional Wear',
    occasion: 'Festival / puja',
    budget: '₹10,000 – ₹25,000',
    preferredDate: '',
    message: 'Mother–daughter festive saree and lehenga pairing.',
    status: 'New',
    source: 'Contact',
    assignee: 'Unassigned',
    notes: [],
    timeline: [
      {
        id: 't1',
        type: 'created',
        label: 'Lead created',
        detail: 'From contact form',
        createdAt: isoDaysAgo(0, 11),
      },
    ],
    createdAt: isoDaysAgo(0, 11),
    updatedAt: isoDaysAgo(0, 11),
  },
  {
    id: 'lead-004',
    name: 'Lakshmi Devi',
    phone: '9090901234',
    email: 'lakshmi@example.com',
    city: 'Kurnool',
    service: 'Boutique Styling',
    occasion: 'Family occasion',
    budget: 'Prefer to discuss',
    preferredDate: '2026-09-01',
    message: 'Walk-in interest in festive styling for a family function.',
    status: 'Contacted',
    source: 'Walk-in',
    assignee: 'Studio Lead',
    notes: [
      {
        id: 'n1',
        body: 'Called back — visiting Saturday morning.',
        author: 'Studio Lead',
        createdAt: isoDaysAgo(1, 17),
      },
    ],
    timeline: [
      {
        id: 't1',
        type: 'created',
        label: 'Lead created',
        createdAt: isoDaysAgo(3, 15),
      },
      {
        id: 't2',
        type: 'assigned',
        label: 'Assigned to Studio Lead',
        createdAt: isoDaysAgo(3, 15),
      },
      {
        id: 't3',
        type: 'status',
        label: 'Status → Contacted',
        createdAt: isoDaysAgo(1, 17),
      },
      {
        id: 't4',
        type: 'note',
        label: 'Note added',
        createdAt: isoDaysAgo(1, 17),
      },
    ],
    createdAt: isoDaysAgo(3, 15),
    updatedAt: isoDaysAgo(1, 17),
  },
  {
    id: 'lead-005',
    name: 'Sneha Patel',
    phone: '9811122233',
    email: 'sneha.p@example.com',
    city: 'Hyderabad',
    service: 'Bridal Wear',
    occasion: 'Wedding / bridal',
    budget: '₹50,000+',
    preferredDate: '2026-06-20',
    message: 'Reception pastel lehenga — travelling to Kurnool for fittings.',
    status: 'Completed',
    source: 'Referral',
    assignee: 'Bridal Desk',
    notes: [
      {
        id: 'n1',
        body: 'Final delivery done. Happy with pastel reception look.',
        author: 'Bridal Desk',
        createdAt: isoDaysAgo(12, 13),
      },
    ],
    timeline: [
      {
        id: 't1',
        type: 'created',
        label: 'Lead created',
        createdAt: isoDaysAgo(40, 10),
      },
      {
        id: 't2',
        type: 'status',
        label: 'Status → Completed',
        detail: 'Garment delivered',
        createdAt: isoDaysAgo(12, 13),
      },
    ],
    createdAt: isoDaysAgo(40, 10),
    updatedAt: isoDaysAgo(12, 13),
  },
  {
    id: 'lead-006',
    name: 'Divya Rao',
    phone: '9000011122',
    email: 'divya.rao@example.com',
    city: 'Kurnool',
    service: 'Traditional Wear',
    occasion: 'Other',
    budget: 'Under ₹10,000',
    preferredDate: '',
    message: 'Budget mismatch after fabric discussion.',
    status: 'Rejected',
    source: 'Request Service',
    assignee: 'Studio Lead',
    notes: [
      {
        id: 'n1',
        body: 'Closed — asked to reconnect next festive season.',
        author: 'Studio Lead',
        createdAt: isoDaysAgo(20, 9),
      },
    ],
    timeline: [
      {
        id: 't1',
        type: 'created',
        label: 'Lead created',
        createdAt: isoDaysAgo(25, 8),
      },
      {
        id: 't2',
        type: 'status',
        label: 'Status → Rejected',
        createdAt: isoDaysAgo(20, 9),
      },
    ],
    createdAt: isoDaysAgo(25, 8),
    updatedAt: isoDaysAgo(20, 9),
  },
];

export function statusTone(status: LeadStatus): string {
  switch (status) {
    case 'New':
      return 'border-gold/50 bg-gold/15 text-black';
    case 'Contacted':
      return 'border-black/20 bg-black/[0.04] text-black';
    case 'Qualified':
      return 'border-black/30 bg-black text-cream';
    case 'Appointment':
      return 'border-gold bg-gold text-black';
    case 'Completed':
      return 'border-black/15 bg-cream text-black/70';
    case 'Rejected':
      return 'border-black/20 bg-transparent text-black/45';
    default:
      return 'border-black/15 text-black';
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
