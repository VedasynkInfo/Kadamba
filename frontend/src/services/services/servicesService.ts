import api from '../api/client';
import type { PaginatedData } from '@/types';
import { parseApiData } from '@/lib/parse';
import { serviceDetailSchema, servicesPageSchema } from '@/shared/schemas';
import type { ServiceDetail } from '@/pages/services/data';

const MONGO_ID = /^[a-f\d]{24}$/i;

export const servicesApi = {
  list: async (
    params?: Record<string, string | number | boolean>,
  ): Promise<PaginatedData<ServiceDetail>> => {
    const { data } = await api.get('/services', { params: { limit: 100, ...params } });
    return parseApiData(servicesPageSchema, data, 'the services list');
  },

  upsert: async (item: ServiceDetail): Promise<ServiceDetail> => {
    const { id, ...body } = item;
    if (MONGO_ID.test(id)) {
      const { data } = await api.put(`/services/${id}`, body);
      return parseApiData(serviceDetailSchema, data, 'the saved service');
    }
    const { data } = await api.post('/services', body);
    return parseApiData(serviceDetailSchema, data, 'the saved service');
  },

  remove: async (id: string) => {
    await api.delete(`/services/${id}`);
  },
};
