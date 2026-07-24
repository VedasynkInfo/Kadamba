import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface CustomerNote {
  body: string;
  pinned: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CustomerAddress {
  line1?: string;
  line2?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  address?: CustomerAddress;
  source?: string;
  tags?: string[];
  notes?: string;
  crmNotes?: CustomerNote[];
  portalStatus?: 'none' | 'invited' | 'active' | 'locked' | string;
  preferredUnit?: 'in' | 'cm' | string;
  portalUserId?: string;
  orderCount?: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
  summary?: {
    orderCount: number;
    activeOrderCount: number;
    measurementCount: number;
    totalSpent: number;
  };
}

export const customerApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedData<Customer>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<Customer>>>('/admin/customers', { params });
    return data.data!;
  },

  get: async (id: string): Promise<Customer> => {
    const { data } = await api.get<ApiResponse<Customer>>(`/admin/customers/${id}`);
    return data.data!;
  },

  create: async (payload: {
    name: string;
    phone: string;
    email?: string;
    whatsapp?: string;
    address?: CustomerAddress;
    source?: string;
    tags?: string[];
    notes?: string;
    force?: boolean;
  }): Promise<Customer> => {
    const { data } = await api.post<ApiResponse<Customer>>('/admin/customers', payload);
    return data.data!;
  },

  update: async (id: string, payload: {
    name?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: CustomerAddress;
    source?: string;
    tags?: string[];
    notes?: string;
    portalStatus?: string;
    preferredUnit?: 'in' | 'cm';
    archive?: boolean;
  }): Promise<Customer> => {
    const { data } = await api.patch<ApiResponse<Customer>>(`/admin/customers/${id}`, payload);
    return data.data!;
  },

  addNote: async (id: string, body: string, pinned = false): Promise<CustomerNote[]> => {
    const { data } = await api.post<ApiResponse<CustomerNote[]>>(`/admin/customers/${id}/notes`, { body, pinned });
    return data.data!;
  },

  getOrders: async (id: string): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>(`/admin/customers/${id}/orders`);
    return data.data!;
  },

  getMeasurements: async (id: string): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>(`/admin/customers/${id}/measurements`);
    return data.data!;
  },
};
