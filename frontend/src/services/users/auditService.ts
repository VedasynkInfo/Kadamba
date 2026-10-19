import api from '@/services/api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface AuditEntry {
  id: string;
  action: string;
  actorType: 'user' | 'customer' | 'system';
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  changes?: Record<string, unknown>;
  ip?: string;
  outcome: 'success' | 'failure';
  createdAt: string;
}

export const auditApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    q?: string;
    action?: string;
    outcome?: string;
    from?: string;
    to?: string;
  }) => {
    const { data } = await api.get<ApiResponse<PaginatedData<AuditEntry>>>('/auth/audit', {
      params,
    });
    return data.data!;
  },

  verify: async () => {
    const { data } = await api.get<
      ApiResponse<{ valid: boolean; checked: number; brokenAt?: string; reason?: string }>
    >('/auth/audit/verify');
    return data.data!;
  },
};
