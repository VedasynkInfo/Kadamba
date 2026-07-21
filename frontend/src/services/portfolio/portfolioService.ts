import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';
import type { PortfolioProject } from '@/pages/portfolio/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const portfolioApi = {
  list: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiResponse<PaginatedData<PortfolioProject>>>('/portfolio', {
      params: { limit: 100, ...params },
    });
    return data.data!;
  },

  upsert: async (item: PortfolioProject) => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put<ApiResponse<PortfolioProject>>(`/portfolio/${id}`, body);
      return data.data!;
    }
    const { data } = await api.post<ApiResponse<PortfolioProject>>('/portfolio', body);
    return data.data!;
  },

  remove: async (id: string) => {
    await api.delete(`/portfolio/${id}`);
  },
};
