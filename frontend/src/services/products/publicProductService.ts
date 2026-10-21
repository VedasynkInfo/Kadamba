import api from '../api/client';
import type { ApiResponse } from '@/types';

export interface PublicProductCategory {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface PublicProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface PublicProductVariant {
  id: string;
  name: string;
  description?: string;
  priceRange?: string;
}

export interface PublicProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * The storefront shape, deliberately smaller than the admin `ProductType`.
 *
 * It carries no measurement-template code, stage defaults for production, or
 * inactive records: a public page should not be able to leak workshop setup.
 * Gallery/variant/lead-time fields are safe marketing data and belong here.
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
  gallery: PublicProductImage[];
  variants: PublicProductVariant[];
  leadTimeDays?: number;
  leadTimeNote?: string;
  tags: string[];
  featured: boolean;
  seo?: PublicProductSeo;
  sortOrder: number;
}

export interface PublicCatalog {
  categories: PublicProductCategory[];
  products: PublicProduct[];
}

export const publicProductApi = {
  list: async (params?: { featured?: boolean }): Promise<PublicCatalog> => {
    const { data } = await api.get<ApiResponse<PublicCatalog>>('/products', {
      params: params?.featured === undefined ? undefined : { featured: String(params.featured) },
    });
    return data.data!;
  },

  get: async (slug: string): Promise<PublicProduct> => {
    const { data } = await api.get<ApiResponse<PublicProduct>>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return data.data!;
  },
};
