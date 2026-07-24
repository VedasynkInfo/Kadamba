import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface MeasurementTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  fieldDefs: MeasurementFieldDef[];
  active: boolean;
  version: number;
}

export interface MeasurementFieldDef {
  key: string;
  label: string;
  type: 'number' | 'text' | 'enum' | 'boolean';
  unit?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: string[];
  helpText?: string;
  group: string;
  sortOrder: number;
}

export interface MeasurementProfile {
  id: string;
  customerId: string;
  productTypeCode: string;
  customerName?: string;
  productTypeName?: string;
  profileName: string;
  unit: string;
  status: 'draft' | 'active' | 'archived' | 'pending_approval';
  values: Record<string, unknown>;
  notes?: string;
  orderId?: string;
  measuredBy?: string;
  measuredAt: string;
  referenceImages?: string[];
  currentVersion: number;
  versions?: MeasurementVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementVersion {
  values: Record<string, unknown>;
  notes?: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
  referenceImages?: string[];
}

const MONGO_ID = /^[a-f\d]{24}$/i;

export const measurementApi = {
  // ── Templates ──
  listTemplates: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<MeasurementTemplate>>>('/measurement-templates', {
      params: { limit: 50, ...params },
    });
    return data.data!;
  },

  getTemplate: async (code: string) => {
    const { data } = await api.get<ApiResponse<MeasurementTemplate>>(`/measurement-templates/${code}`);
    return data.data!;
  },

  createTemplate: async (body: Partial<MeasurementTemplate>) => {
    const { data } = await api.post<ApiResponse<MeasurementTemplate>>('/measurement-templates', body);
    return data.data!;
  },

  updateTemplate: async (code: string, body: Partial<MeasurementTemplate>) => {
    const { data } = await api.put<ApiResponse<MeasurementTemplate>>(`/measurement-templates/${code}`, body);
    return data.data!;
  },

  archiveTemplate: async (code: string, active: boolean) => {
    const { data } = await api.patch<ApiResponse<MeasurementTemplate>>(`/measurement-templates/${code}/archive`, { active });
    return data.data!;
  },

  seedTemplates: async () => {
    const { data } = await api.post<ApiResponse<{ message: string; count: number }>>('/measurement-templates/seed');
    return data.data!;
  },

  // ── Profiles ──
  list: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<MeasurementProfile>>>('/measurements', {
      params: { limit: 50, ...params },
    });
    return data.data!;
  },

  get: async (id: string) => {
    const { data } = await api.get<ApiResponse<MeasurementProfile>>(`/measurements/${id}`);
    return data.data!;
  },

  create: async (body: Record<string, unknown>) => {
    const { data } = await api.post<ApiResponse<MeasurementProfile>>('/measurements', body);
    return data.data!;
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const { data } = await api.put<ApiResponse<MeasurementProfile>>(`/measurements/${id}`, body);
    return data.data!;
  },

  archive: async (id: string, archive: boolean) => {
    const { data } = await api.patch<ApiResponse<MeasurementProfile>>(`/measurements/${id}/archive`, { archive });
    return data.data!;
  },

  duplicate: async (id: string) => {
    const { data } = await api.post<ApiResponse<MeasurementProfile>>(`/measurements/${id}/duplicate`);
    return data.data!;
  },

  getHistory: async (id: string) => {
    const { data } = await api.get<ApiResponse<{ profile: MeasurementProfile; versions: MeasurementVersion[] }>>(`/measurements/${id}/history`);
    return data.data!;
  },

  seed: async () => {
    const { data } = await api.post<ApiResponse<{ message: string; count: number }>>('/measurements/seed');
    return data.data!;
  },

  approve: async (id: string) => {
    const { data } = await api.patch<
      ApiResponse<{ id: string; status: string; profileName: string; customerName?: string }>
    >(`/admin/portal/measurements/${id}/approve`);
    return data.data!;
  },

  upsert: async (item: MeasurementProfile) => {
    if (MONGO_ID.test(item.id)) {
      return measurementApi.update(item.id, item as unknown as Record<string, unknown>);
    }
    return measurementApi.create(item as unknown as Record<string, unknown>);
  },
};