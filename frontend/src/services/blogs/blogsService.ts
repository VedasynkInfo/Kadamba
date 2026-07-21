import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';
import type { BlogPost } from '@/pages/blogs/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const blogsApi = {
  list: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<BlogPost>>>('/blogs', {
      params: { limit: 100, ...params },
    });
    return data.data!;
  },

  upsert: async (item: BlogPost) => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put<ApiResponse<BlogPost>>(`/blogs/${id}`, body);
      return data.data!;
    }
    const { data } = await api.post<ApiResponse<BlogPost>>('/blogs', body);
    return data.data!;
  },

  remove: async (id: string) => {
    await api.delete(`/blogs/${id}`);
  },
};
