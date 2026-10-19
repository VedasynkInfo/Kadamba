import api from '../api/client';
import type { ApiResponse } from '@/types';
import type { WebsiteSettings } from '@/pages/admin/data';

export const settingsApi = {
  /** Public-safe settings (no SMTP secrets) */
  get: async () => {
    const { data } = await api.get<ApiResponse<WebsiteSettings>>('/settings/public');
    return data.data!;
  },

  /** Admin settings with masked SMTP password */
  getAdmin: async () => {
    const { data } = await api.get<ApiResponse<WebsiteSettings>>('/admin/settings');
    return data.data!;
  },

  update: async (payload: WebsiteSettings) => {
    const { data } = await api.put<ApiResponse<WebsiteSettings>>('/admin/settings', payload);
    return data.data!;
  },

  patch: async (section: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch<ApiResponse<WebsiteSettings>>('/admin/settings', {
      section,
      data: payload,
    });
    return data.data!;
  },

  testEmail: async (to?: string) => {
    const { data } = await api.post<ApiResponse<{ sent: boolean; to: string }>>(
      '/admin/settings/test-email',
      { to },
    );
    return data.data!;
  },
};
