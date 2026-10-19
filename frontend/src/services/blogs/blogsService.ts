import api from '../api/client';
import type { PaginatedData } from '@/types';
import { parseApiData } from '@/lib/parse';
import { blogPostSchema, blogsPageSchema } from '@/shared/schemas';
import type { BlogPost } from '@/pages/blogs/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const blogsApi = {
  list: async (
    params?: Record<string, string | number | boolean>,
  ): Promise<PaginatedData<BlogPost>> => {
    const { data } = await api.get('/blogs', { params: { limit: 100, ...params } });
    return parseApiData(blogsPageSchema, data, 'the journal');
  },

  upsert: async (item: BlogPost): Promise<BlogPost> => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put(`/blogs/${id}`, body);
      return parseApiData(blogPostSchema, data, 'the saved post');
    }
    const { data } = await api.post('/blogs', body);
    return parseApiData(blogPostSchema, data, 'the saved post');
  },

  remove: async (id: string) => {
    await api.delete(`/blogs/${id}`);
  },
};
