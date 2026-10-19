import api from '../api/client';
import type { PaginatedData } from '@/types';
import { parseApiData } from '@/lib/parse';
import { portfolioPageSchema, portfolioProjectSchema } from '@/shared/schemas';
import type { PortfolioProject } from '@/pages/portfolio/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const portfolioApi = {
  list: async (
    params?: Record<string, string | number | boolean>,
  ): Promise<PaginatedData<PortfolioProject>> => {
    const { data } = await api.get('/portfolio', { params: { limit: 100, ...params } });
    return parseApiData(portfolioPageSchema, data, 'the portfolio list');
  },

  upsert: async (item: PortfolioProject): Promise<PortfolioProject> => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put(`/portfolio/${id}`, body);
      return parseApiData(portfolioProjectSchema, data, 'the saved project');
    }
    const { data } = await api.post('/portfolio', body);
    return parseApiData(portfolioProjectSchema, data, 'the saved project');
  },

  remove: async (id: string) => {
    await api.delete(`/portfolio/${id}`);
  },
};
