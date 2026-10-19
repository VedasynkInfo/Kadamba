import api from '../api/client';
import type { PaginatedData } from '@/types';
import { parseApiData } from '@/lib/parse';
import { galleryItemSchema, galleryPageSchema } from '@/shared/schemas';
import type { GalleryItem } from '@/pages/gallery/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const galleryApi = {
  list: async (
    params?: Record<string, string | number | boolean>,
  ): Promise<PaginatedData<GalleryItem>> => {
    const { data } = await api.get('/gallery', { params: { limit: 100, ...params } });
    return parseApiData(galleryPageSchema, data, 'the gallery list');
  },

  upsert: async (item: GalleryItem): Promise<GalleryItem> => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put(`/gallery/${id}`, body);
      return parseApiData(galleryItemSchema, data, 'the saved gallery item');
    }
    const { data } = await api.post('/gallery', body);
    return parseApiData(galleryItemSchema, data, 'the saved gallery item');
  },

  remove: async (id: string) => {
    await api.delete(`/gallery/${id}`);
  },
};
