import { LEAD_STATUSES, type LeadStatus } from '@/pages/leads/data';

export type LeadQuality = 'hot' | 'warm' | 'cold';

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [...LEAD_STATUSES];

export const LEAD_QUALITY_OPTIONS: LeadQuality[] = ['hot', 'warm', 'cold'];

export const LEAD_DESK_OPTIONS = [
  'Boutique Desk',
  'Bridal Lounge',
  'Master Tailor',
  'Online Concierge',
];

export interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  source: string;
  assignee: string;
  status: LeadStatus;
  quality: LeadQuality;
  notes: string;
}

export const createEmptyLeadForm = (): LeadFormData => ({
  name: '',
  phone: '',
  email: '',
  city: 'Kurnool',
  service: 'Bridal Couture',
  source: 'website',
  assignee: 'Boutique Desk',
  status: 'New',
  quality: 'warm',
  notes: '',
});

export interface LeadsMetricsData {
  total: number;
  open: number;
  appointments: number;
  hotLeads: number;
}
