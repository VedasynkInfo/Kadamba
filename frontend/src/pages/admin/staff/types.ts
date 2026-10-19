import type { Staff } from '@/services/staff/staffService';

export const SPECIALIZATIONS = [
  { value: 'blouse-stitching', label: 'Blouse Stitching' },
  { value: 'bridal-lehenga', label: 'Bridal Lehenga Tailoring' },
  { value: 'maggam', label: 'Maggam Embroidery' },
  { value: 'hand-embroidery', label: 'Hand Embroidery / Aari' },
  { value: 'machine-embroidery', label: 'Machine Embroidery' },
  { value: 'cutting', label: 'Pattern Making / Cutting' },
  { value: 'finishing', label: 'Finishing / Alteration' },
  { value: 'fabric-selection', label: 'Fabric Selection' },
  { value: 'customer-consultation', label: 'Customer Consultation' },
  { value: 'trial-management', label: 'Trial Management' },
  { value: 'quality-inspection', label: 'Quality Inspection' },
  { value: 'admin', label: 'Admin / Front Desk' },
];

export const EMPLOYMENT_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'intern', label: 'Intern' },
];

export const SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'piece-rate', label: 'Piece Rate' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'other', label: 'Other' },
];

export interface StaffFormData {
  fullName: string;
  phone: string;
  email: string;
  locality: string;
  address: string;
  joiningDate: string;
  employmentType: 'permanent' | 'freelance' | 'intern';
  specializations: string[];
  yearsExperience: string;
  previousWorkplaces: string;
  languages: string;
  emergencyName: string;
  emergencyPhone: string;
  salaryType: 'monthly' | 'piece-rate' | 'freelance' | 'other';
  salaryAmount: string;
  status: 'active' | 'inactive';
}

export function createBlankStaffForm(): StaffFormData {
  return {
    fullName: '',
    phone: '',
    email: '',
    locality: '',
    address: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentType: 'permanent',
    specializations: [],
    yearsExperience: '',
    previousWorkplaces: '',
    languages: '',
    emergencyName: '',
    emergencyPhone: '',
    salaryType: 'monthly',
    salaryAmount: '',
    status: 'active',
  };
}

export function staffToFormData(s: Staff): StaffFormData {
  return {
    fullName: s.fullName,
    phone: s.phone,
    email: s.email || '',
    locality: s.locality,
    address: s.address || '',
    joiningDate: s.joiningDate ? s.joiningDate.slice(0, 10) : '',
    employmentType: s.employmentType,
    specializations: s.specializations || [],
    yearsExperience: s.yearsExperience ? String(s.yearsExperience) : '',
    previousWorkplaces: (s.previousWorkplaces || []).join(', '),
    languages: (s.languages || []).join(', '),
    emergencyName: s.emergencyContact?.name || '',
    emergencyPhone: s.emergencyContact?.phone || '',
    salaryType: s.salaryType,
    salaryAmount: s.salaryAmount ? String(s.salaryAmount) : '',
    status: s.status,
  };
}
