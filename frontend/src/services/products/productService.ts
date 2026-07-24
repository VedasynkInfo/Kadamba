import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';

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

export interface ProductType {
  id: string;
  _id?: string;
  code: string;
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
  active: boolean;
  sortOrder: number;
  indicativePriceRange?: string;
  defaultStages: string[];
  image?: string;
  createdAt: string;
  updatedAt: string;
}

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
    const { data } = await api.post<ApiResponse<ProductCategory>>('/admin/products/categories', payload);
    return data.data!;
  },

  updateCategory: async (id: string, payload: {
    code?: string;
    name?: string;
    sortOrder?: number;
    active?: boolean;
  }): Promise<ProductCategory> => {
    const { data } = await api.patch<ApiResponse<ProductCategory>>(`/admin/products/categories/${id}`, payload);
    return data.data!;
  },

  listProductTypes: async (params?: {
    categoryId?: string;
    search?: string;
    active?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedData<ProductType>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<ProductType>>>('/admin/products/product-types', { params });
    return data.data!;
  },

  getProductType: async (id: string): Promise<ProductType> => {
    const { data } = await api.get<ApiResponse<ProductType>>(`/admin/products/product-types/${id}`);
    return data.data!;
  },

  createProductType: async (payload: {
    code: string;
    name: string;
    categoryId: string;
    description?: string;
    publicDescription?: string;
    measurementTemplateId?: string;
    active?: boolean;
    sortOrder?: number;
    indicativePriceRange?: string;
    defaultStages?: string[];
    image?: string;
  }): Promise<ProductType> => {
    const { data } = await api.post<ApiResponse<ProductType>>('/admin/products/product-types', payload);
    return data.data!;
  },

  updateProductType: async (id: string, payload: {
    code?: string;
    name?: string;
    categoryId?: string;
    description?: string;
    publicDescription?: string;
    measurementTemplateId?: string;
    active?: boolean;
    sortOrder?: number;
    indicativePriceRange?: string;
    defaultStages?: string[];
    image?: string;
  }): Promise<ProductType> => {
    const { data } = await api.patch<ApiResponse<ProductType>>(`/admin/products/product-types/${id}`, payload);
    return data.data!;
  },

  seedCatalog: async (): Promise<{ categoriesSeeded: number; typesSeeded: number }> => {
    const { data } = await api.post<ApiResponse<{ categoriesSeeded: number; typesSeeded: number }>>('/admin/products/seed');
    return data.data!;
  },
};
