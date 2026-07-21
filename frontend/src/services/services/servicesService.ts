import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';
import type { ServiceDetail } from '@/pages/services/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const servicesApi = {
  list: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<ServiceDetail>>>('/services', {
      params: { limit: 100, ...params },
    });
    return data.data!;
  },

  upsert: async (item: ServiceDetail) => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put<ApiResponse<ServiceDetail>>(`/services/${id}`, body);
      return data.data!;
    }
    const { data } = await api.post<ApiResponse<ServiceDetail>>('/services', body);
    return data.data!;
  },

  remove: async (id: string) => {
    await api.delete(`/services/${id}`);
  },
};
