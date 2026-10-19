import type { GlyphName } from '@/components/icons';
import type { MeasurementProfile, MeasurementTemplate } from '@/services/measurements/measurementsService';

export type DeskTab = 'all' | 'pending';

export const MEASUREMENT_UNITS = [
  { value: 'inches', label: 'Inches (Standard Indian Couture)' },
  { value: 'cm', label: 'Centimeters (Metric)' },
];

export const MEASUREMENT_STATUSES = [
  { value: 'active', label: 'Active (Approved for Tailoring)' },
  { value: 'pending_approval', label: 'Pending Tailor Approval' },
  { value: 'draft', label: 'Draft Specification' },
  { value: 'archived', label: 'Archived / Historical' },
];

export const SILHOUETTE_FALLBACKS: { code: string; name: string; icon: GlyphName }[] = [
  { code: 'BR-LH', name: 'Bridal Lehenga Set', icon: 'bridal' },
  { code: 'BLOUSE', name: 'Maggam / Couture Blouse', icon: 'couture' },
  { code: 'KURTA', name: 'Designer Kurta & Anarkali', icon: 'thread' },
  { code: 'GOWN', name: 'Indo-Western Evening Gown', icon: 'garment' },
  { code: 'SAREE', name: 'Pre-stitched Draped Saree', icon: 'drape' },
];

export function getSilhouetteMeta(
  code: string,
  templates: MeasurementTemplate[] = [],
): { code: string; name: string; icon: GlyphName } {
  const foundTemplate = templates.find((t) => t.code === code);
  if (foundTemplate) {
    return {
      code: foundTemplate.code,
      name: foundTemplate.name,
      icon: 'couture',
    };
  }
  const fallback = SILHOUETTE_FALLBACKS.find((s) => s.code === code);
  if (fallback) return fallback;
  return { code, name: code, icon: 'thread' };
}

export interface ProfileFormData {
  id?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productTypeCode: string;
  profileName: string;
  unit: string;
  status: 'draft' | 'active' | 'archived' | 'pending_approval';
  values: Record<string, unknown>;
  notes: string;
  measuredAt: string;
  measuredBy: string;
  referenceImages: string[];
}

export function createBlankProfileForm(defaultCode = 'BR-LH'): ProfileFormData {
  return {
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productTypeCode: defaultCode,
    profileName: '',
    unit: 'inches',
    status: 'draft',
    values: {},
    notes: '',
    measuredAt: new Date().toISOString().slice(0, 10),
    measuredBy: 'Master Tailor Desk',
    referenceImages: [],
  };
}

export function profileToFormData(p: MeasurementProfile): ProfileFormData {
  return {
    id: p.id,
    customerId: p.customerId,
    customerName: p.customerName || '',
    productTypeCode: p.productTypeCode || 'BR-LH',
    profileName: p.profileName,
    unit: p.unit || 'inches',
    status: p.status,
    values: p.values || {},
    notes: p.notes || '',
    measuredAt: p.measuredAt ? p.measuredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    measuredBy: p.measuredBy || 'Master Tailor Desk',
    referenceImages: p.referenceImages || [],
  };
}
