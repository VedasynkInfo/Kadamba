import api from '../api/client';
import { parseApiData } from '@/lib/parse';
import { websiteSettingsSchema } from '@/shared/schemas';
import { mergeWebsiteSettings } from '@/utils/websiteSettings';
import type { WebsiteSettings } from '@/pages/admin/data';

/**
 * The settings endpoint returns a partial document — a section an editor has
 * never opened is simply absent, and the public endpoint strips the SMTP
 * credentials entirely. Every read therefore merges the studio's own defaults
 * over whatever arrived, so a caller always gets a complete `WebsiteSettings`
 * instead of a shape it has to null-check field by field.
 */
const settingsResponseSchema = websiteSettingsSchema.nullable();

function readSettings(payload: unknown, what: string): WebsiteSettings {
  return mergeWebsiteSettings(parseApiData(settingsResponseSchema, payload, what));
}

export const settingsApi = {
  /** Public-safe settings (no SMTP secrets) */
  get: async (): Promise<WebsiteSettings> => {
    const { data } = await api.get('/settings/public');
    return readSettings(data, 'the studio settings');
  },

  /** Admin settings with masked SMTP password */
  getAdmin: async (): Promise<WebsiteSettings> => {
    const { data } = await api.get('/admin/settings');
    return readSettings(data, 'the studio settings');
  },

  update: async (payload: WebsiteSettings): Promise<WebsiteSettings> => {
    const { data } = await api.put('/admin/settings', payload);
    return readSettings(data, 'the saved settings');
  },

  patch: async (section: string, payload: Record<string, unknown>): Promise<WebsiteSettings> => {
    const { data } = await api.patch('/admin/settings', {
      section,
      data: payload,
    });
    return readSettings(data, 'the saved settings');
  },

  testEmail: async (to?: string) => {
    const { data } = await api.post<{ success: boolean; data?: { sent: boolean; to: string } }>(
      '/admin/settings/test-email',
      { to },
    );
    return data.data!;
  },
};
