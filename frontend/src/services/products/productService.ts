import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';
import type { MeasurementFieldDef } from '@/services/measurements/measurementsService';

export interface ProductCategory {
  id: string;
  _id?: string;
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductGalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  description?: string;
  priceRange?: string;
  active: boolean;
}

export interface ProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export interface MeasurementTemplateSummary {
  id: string;
  code: string;
  name: string;
  category: string;
  active: boolean;
  version: number;
  fieldDefs: MeasurementFieldDef[];
}

export interface ProductType {
  id: string;
  _id?: string;
  code: string;
  slug?: string;
  name: string;
  categoryId: {
    id: string;
    _id?: string;
    name: string;
    code: string;
  };
  description?: string;
  publicDescription?: string;
  measurementTemplateId?: string;
  measurementTemplate?: MeasurementTemplateSummary | null;
  gallery: ProductGalleryImage[];
  variants: ProductVariant[];
  leadTimeDays?: number;
  leadTimeNote?: string;
  tags: string[];
  featured: boolean;
  seo?: ProductSeo;
  sku?: string;
  active: boolean;
  sortOrder: number;
  indicativePriceRange?: string;
  defaultStages: string[];
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUsage {
  orderCount: number;
  openOrderCount: number;
  serviceCount: number;
  services: Array<{ id: string; title: string; slug: string; published: boolean }>;
}

export interface ProductImportRow {
  row?: number;
  [key: string]: unknown;
}

export interface ProductImportIssue {
  row: number;
  code?: string;
  message: string;
}

export interface ProductImportResult {
  total: number;
  created: number;
  updated: number;
  failed: ProductImportIssue[];
}

export type ProductPayload = {
  code?: string;
  name?: string;
  slug?: string;
  categoryId?: string;
  description?: string | null;
  publicDescription?: string | null;
  measurementTemplateId?: string | null;
  gallery?: ProductGalleryImage[];
  variants?: ProductVariant[];
  leadTimeDays?: number | null;
  leadTimeNote?: string | null;
  tags?: string[];
  featured?: boolean;
  seo?: ProductSeo | null;
  active?: boolean;
  sortOrder?: number;
  indicativePriceRange?: string | null;
  defaultStages?: string[];
  image?: string | null;
  sku?: string | null;
  stockItem?: string | null;
};

export const productApi = {
  listCategories: async (): Promise<ProductCategory[]> => {
    const { data } = await api.get<ApiResponse<ProductCategory[]>>('/admin/products/categories');
    return data.data!;
  },

  createCategory: async (payload: {
    code: string;
    name: string;
    sortOrder?: number;
    active?: boolean;
  }): Promise<ProductCategory> => {
    const { data } = await api.post<ApiResponse<ProductCategory>>(
      '/admin/products/categories',
      payload,
    );
    return data.data!;
  },

  updateCategory: async (
    id: string,
    payload: {
      code?: string;
      name?: string;
      sortOrder?: number;
      active?: boolean;
    },
  ): Promise<ProductCategory> => {
    const { data } = await api.patch<ApiResponse<ProductCategory>>(
      `/admin/products/categories/${id}`,
      payload,
    );
    return data.data!;
  },

  listProductTypes: async (params?: {
    categoryId?: string;
    search?: string;
    active?: string;
    featured?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedData<ProductType>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<ProductType>>>(
      '/admin/products/product-types',
      { params },
    );
    return data.data!;
  },

  getProductType: async (id: string): Promise<ProductType> => {
    const { data } = await api.get<ApiResponse<ProductType>>(`/admin/products/product-types/${id}`);
    return data.data!;
  },

  createProductType: async (payload: ProductPayload): Promise<ProductType> => {
    const { data } = await api.post<ApiResponse<ProductType>>(
      '/admin/products/product-types',
      payload,
    );
    return data.data!;
  },

  updateProductType: async (id: string, payload: ProductPayload): Promise<ProductType> => {
    const { data } = await api.patch<ApiResponse<ProductType>>(
      `/admin/products/product-types/${id}`,
      payload,
    );
    return data.data!;
  },

  reorderProductTypes: async (ids: string[]): Promise<{ updated: number }> => {
    const { data } = await api.patch<ApiResponse<{ updated: number }>>(
      '/admin/products/product-types/reorder',
      { ids },
    );
    return data.data!;
  },

  bulkUpdateProductTypes: async (
    ids: string[],
    updates: { active?: boolean; featured?: boolean; categoryId?: string },
  ): Promise<{ updated: number }> => {
    const { data } = await api.patch<ApiResponse<{ updated: number }>>(
      '/admin/products/product-types/bulk',
      { ids, updates },
    );
    return data.data!;
  },

  getProductUsage: async (id: string): Promise<ProductUsage> => {
    const { data } = await api.get<ApiResponse<ProductUsage>>(
      `/admin/products/product-types/${id}/usage`,
    );
    return data.data!;
  },

  importProductTypes: async (rows: ProductImportRow[]): Promise<ProductImportResult> => {
    const { data } = await api.post<ApiResponse<ProductImportResult>>(
      '/admin/products/product-types/import',
      { rows },
    );
    return data.data!;
  },

  seedCatalog: async (): Promise<{ categoriesSeeded: number; typesSeeded: number }> => {
    const { data } =
      await api.post<ApiResponse<{ categoriesSeeded: number; typesSeeded: number }>>(
        '/admin/products/seed',
      );
    return data.data!;
  },
};
