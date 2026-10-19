import api from '@/services/api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface MediaVariant {
  width: number;
  format: string;
  url: string;
  bytes: number;
}

/** A place in the content that references this file. */
export interface MediaUsage {
  entityType: string;
  label: string;
  entityId: string;
  title: string;
  field: string;
}

export interface MediaAsset {
  _id: string;
  hash: string;
  kind: 'image' | 'video';
  originalUrl: string;
  originalName?: string;
  mimeType: string;
  format?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  bytes?: number;
  blurhash?: string;
  dominantColor?: string;
  posterUrl?: string;
  variants: MediaVariant[];
  alt?: string;
  folder?: string;
  createdAt?: string;
  /** Populated on list/detail responses. */
  usage?: MediaUsage[];
}

export interface MediaListParams {
  page?: number;
  limit?: number;
  folder?: string;
  kind?: 'image' | 'video';
  q?: string;
  unusedOnly?: boolean;
}

export interface DeleteMediaResult {
  removedFiles: number;
}

/** Body shape the API returns for a refused delete. */
interface DeleteConflict {
  message?: string;
  errors?: Array<{ usage?: MediaUsage[]; hint?: string }>;
}

export const mediaApi = {
  list: async (params: MediaListParams = {}) => {
    const { data } = await api.get<ApiResponse<PaginatedData<MediaAsset>>>('/admin/media', {
      params,
    });
    return data.data!;
  },

  folders: async () => {
    const { data } = await api.get<ApiResponse<string[]>>('/admin/media/folders');
    return data.data ?? [];
  },

  get: async (id: string) => {
    const { data } = await api.get<ApiResponse<MediaAsset>>(`/admin/media/${id}`);
    return data.data!;
  },

  setAlt: async (id: string, alt: string) => {
    const { data } = await api.patch<ApiResponse<MediaAsset>>(`/admin/media/${id}`, { alt });
    return data.data!;
  },

  regenerate: async (id: string) => {
    const { data } = await api.post<ApiResponse<MediaAsset>>(`/admin/media/${id}/regenerate`);
    return data.data!;
  },

  remove: async (id: string, force = false) => {
    const { data } = await api.delete<ApiResponse<DeleteMediaResult>>(`/admin/media/${id}`, {
      params: force ? { force: true } : undefined,
    });
    return data.data!;
  },
};

/**
 * True when a delete was refused because the file is still in use, and the
 * caller should offer to force it. The server answers 409 with the list of
 * referencing records, which is exactly what an operator needs to decide.
 */
export function isInUseConflict(error: unknown): MediaUsage[] | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const response = (error as { response?: { status?: number; data?: DeleteConflict } }).response;
  if (response?.status !== 409) return null;
  const usage = response.data?.errors?.[0]?.usage;
  return Array.isArray(usage) ? usage : [];
}

/** Human-readable error message from an axios error, matching uploadService. */
export function mediaErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: DeleteConflict } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
