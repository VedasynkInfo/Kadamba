import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';
import type { Lead, LeadStatus } from '@/pages/leads/data';

export interface LeadRequestPayload {
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
  inspirationFiles?: File[];
}

export interface LeadCreated {
  id: string;
  status: string;
  orderId?: string;
  orderNumber?: number;
  referenceId?: string;
}

/**
 * Submit a service request — creates a CRM lead and notifies the studio.
 */
export async function submitLeadRequest(payload: LeadRequestPayload): Promise<LeadCreated> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('phone', payload.phone);
  formData.append('email', payload.email);
  formData.append('city', payload.city);
  if (payload.locality) formData.append('locality', payload.locality);
  formData.append('service', payload.service);
  if (payload.garmentType) formData.append('garmentType', payload.garmentType);
  if (payload.fabricStatus) formData.append('fabricStatus', payload.fabricStatus);
  formData.append('occasion', payload.occasion);
  formData.append('budget', payload.budget);
  formData.append('preferredDate', payload.preferredDate);
  formData.append('message', payload.message);

  for (const file of payload.inspirationFiles ?? []) {
    formData.append('inspiration', file);
  }

  const { data } = await api.post<ApiResponse<LeadCreated>>('/leads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData) {
          delete headers['Content-Type'];
        }
        return body;
      },
    ],
    timeout: 60000,
  });

  return data.data ?? { id: '', status: 'New' };
}

export const leadsAdminApi = {
  list: async (params?: Record<string, string | number>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<Lead>>>('/leads', {
      params: { limit: 100, ...params },
    });
    return data.data!;
  },

  get: async (id: string) => {
    const { data } = await api.get<ApiResponse<Lead>>(`/leads/${id}`);
    return data.data!;
  },

  update: async (id: string, payload: { status?: LeadStatus; assignee?: string }) => {
    const { data } = await api.patch<ApiResponse<Lead>>(`/leads/${id}`, payload);
    return data.data!;
  },

  addNote: async (id: string, body: string, author?: string) => {
    const { data } = await api.post<ApiResponse<Lead>>(`/leads/${id}/notes`, { body, author });
    return data.data!;
  },

  exportCsv: async (params?: Record<string, string>) => {
    const { data } = await api.get<string>('/leads/export', {
      params,
      responseType: 'text',
    });
    return data;
  },
};
