import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface PerformanceNote {
  body: string;
  at: string;
}

export interface Staff {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  locality: string;
  address?: string;
  joiningDate: string;
  employmentType: 'permanent' | 'freelance' | 'intern';
  specializations: string[];
  yearsExperience?: number;
  previousWorkplaces?: string[];
  languages?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  salaryType: 'monthly' | 'piece-rate' | 'freelance' | 'other';
  salaryAmount: number;
  status: 'active' | 'inactive';
  performanceNotes?: PerformanceNote[];
  createdAt: string;
  updatedAt: string;
}

export const staffApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedData<Staff>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<Staff>>>('/admin/staff', { params });
    return data.data!;
  },

  get: async (id: string): Promise<Staff> => {
    const { data } = await api.get<ApiResponse<Staff>>(`/admin/staff/${id}`);
    return data.data!;
  },

  create: async (payload: Partial<Staff>): Promise<Staff> => {
    const { data } = await api.post<ApiResponse<Staff>>('/admin/staff', payload);
    return data.data!;
  },

  update: async (id: string, payload: Partial<Staff>): Promise<Staff> => {
    const { data } = await api.patch<ApiResponse<Staff>>(`/admin/staff/${id}`, payload);
    return data.data!;
  },

  addPerformanceNote: async (id: string, body: string): Promise<Staff> => {
    const { data } = await api.post<ApiResponse<Staff>>(`/admin/staff/${id}/performance-notes`, { body });
    return data.data!;
  },
};
