import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';
import type { GalleryItem } from '@/pages/gallery/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const galleryApi = {
  list: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<GalleryItem>>>('/gallery', {
      params: { limit: 100, ...params },
    });
    return data.data!;
  },

  upsert: async (item: GalleryItem) => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put<ApiResponse<GalleryItem>>(`/gallery/${id}`, body);
      return data.data!;
    }
    const { data } = await api.post<ApiResponse<GalleryItem>>('/gallery', body);
    return data.data!;
  },

  remove: async (id: string) => {
    await api.delete(`/gallery/${id}`);
  },
};
