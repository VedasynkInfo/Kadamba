import api from '../api/client';
import { parseApiData } from '@/lib/parse';
import { leadCreatedSchema, leadSchema, leadsPageSchema } from '@/shared/schemas';
import type { LeadStatus } from '@/pages/leads/data';

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

  const { data } = await api.post('/leads', formData, {
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

  return parseApiData(leadCreatedSchema, data, 'your enquiry');
}

export const leadsAdminApi = {
  list: async (params?: Record<string, string | number>) => {
    const { data } = await api.get('/leads', { params: { limit: 100, ...params } });
    return parseApiData(leadsPageSchema, data, 'the leads desk');
  },

  get: async (id: string) => {
    const { data } = await api.get(`/leads/${id}`);
    return parseApiData(leadSchema, data, 'the lead');
  },

  update: async (id: string, payload: { status?: LeadStatus; assignee?: string }) => {
    const { data } = await api.patch(`/leads/${id}`, payload);
    return parseApiData(leadSchema, data, 'the updated lead');
  },

  addNote: async (id: string, body: string, author?: string) => {
    const { data } = await api.post(`/leads/${id}/notes`, { body, author });
    return parseApiData(leadSchema, data, 'the updated lead');
  },

  scheduleFollowUp: async (
    id: string,
    payload: {
      scheduledAt: string;
      type?: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
      notes?: string;
    },
  ) => {
    const { data } = await api.post(`/leads/${id}/follow-ups`, payload);
    return parseApiData(leadSchema, data, 'the updated lead');
  },

  completeFollowUp: async (
    id: string,
    followUpId: string,
    payload: { outcome?: string; notes?: string },
  ) => {
    const { data } = await api.patch(`/leads/${id}/follow-ups/${followUpId}/complete`, payload);
    return parseApiData(leadSchema, data, 'the updated lead');
  },

  exportCsv: async (params?: Record<string, string>) => {
    const { data } = await api.get<string>('/leads/export', {
      params,
      responseType: 'text',
    });
    return data;
  },
};
