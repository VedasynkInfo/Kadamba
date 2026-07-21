import api from '../api/client';
import type { ApiResponse } from '@/types';
import type { WebsiteSettings } from '@/pages/admin/data';

export const settingsApi = {
  get: async () => {
    const { data } = await api.get<ApiResponse<WebsiteSettings>>('/settings');
    return data.data!;
  },

  update: async (payload: WebsiteSettings) => {
    const { data } = await api.put<ApiResponse<WebsiteSettings>>('/settings', payload);
    return data.data!;
  },
};
