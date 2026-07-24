import api from '../api/client';
import type { ApiResponse } from '@/types';

export interface UploadResult {
  url: string;
  publicId?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  storage?: 'cloudinary' | 'local';
}

/**
 * Extract a readable error message from an Axios error response.
 */
function extractError(err: unknown): string {
  if (typeof err === 'string') return err;

  // Axios wraps server JSON in error.response.data
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response: unknown }).response;
    if (resp && typeof resp === 'object' && 'data' in resp) {
      const body = (resp as { data: unknown }).data;
      if (body && typeof body === 'object' && 'message' in body) {
        const msg = (body as { message: unknown }).message;
        if (typeof msg === 'string') return msg;
      }
    }
  }

  if (err instanceof Error) return err.message;

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }

  return 'Upload failed. Try again.';
}

/**
 * Upload an image or video to the backend (Cloudinary or local fallback).
 */
export async function uploadMedia(
  file: File,
  folder = 'general',
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data } = await api.post<ApiResponse<UploadResult>>('/upload', formData, {
      params: { folder },
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: [
        (body, headers) => {
          if (body instanceof FormData) {
            delete headers['Content-Type'];
          }
          return body;
        },
      ],
      timeout: 120000,
    });

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || 'Upload failed');
    }

    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}
