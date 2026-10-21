import api from '../api/client';
import type { ApiResponse } from '@/types';

export interface PublicProductCategory {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

/**
 * The storefront shape, deliberately smaller than the admin `ProductType`.
 *
 * It carries no measurement-template code, stage defaults for production, or
 * inactive records: a public page should not be able to leak workshop setup.
 */
export interface PublicProduct {
  id: string;
  slug: string;
  code: string;
  name: string;
  category: PublicProductCategory | null;
  description?: string;
  publicDescription?: string;
  indicativePriceRange?: string;
  defaultStages: string[];
  image?: string;
  sortOrder: number;
}

export interface PublicCatalog {
  categories: PublicProductCategory[];
  products: PublicProduct[];
}

export const publicProductApi = {
  list: async (): Promise<PublicCatalog> => {
    const { data } = await api.get<ApiResponse<PublicCatalog>>('/products');
    return data.data!;
  },

  get: async (slug: string): Promise<PublicProduct> => {
    const { data } = await api.get<ApiResponse<PublicProduct>>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return data.data!;
  },
};
