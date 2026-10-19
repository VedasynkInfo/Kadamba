import api from '@/services/api/client';
import type { ApiResponse, PaginatedData, Permission } from '@/types';

export type PermissionKey = Permission;

export interface PermissionGroup {
  group: string;
  permissions: Array<{ key: Permission; label: string }>;
}

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
  permissions: Permission[];
  status: 'active' | 'disabled';
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export const usersApi = {
  list: async (params: { q?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<ApiResponse<PaginatedData<ConsoleUser>>>('/admin/users', {
      params,
    });
    return data.data!;
  },

  permissions: async () => {
    const { data } = await api.get<
      ApiResponse<{
        permissions: Permission[];
        groups: PermissionGroup[];
        staffDefaults: Permission[];
      }>
    >('/admin/users/permissions');
    return data.data!;
  },

  setPermissions: async (userId: string, permissions: Permission[]) => {
    const { data } = await api.put<ApiResponse>(`/auth/users/${userId}/permissions`, {
      permissions,
    });
    return data;
  },

  setStatus: async (userId: string, status: 'active' | 'disabled') => {
    const { data } = await api.patch<ApiResponse>(`/admin/users/${userId}/status`, { status });
    return data;
  },

  setRole: async (userId: string, role: 'admin' | 'staff' | 'user') => {
    const { data } = await api.patch<ApiResponse>(`/admin/users/${userId}/role`, { role });
    return data;
  },
};
