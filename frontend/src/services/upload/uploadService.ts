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
 * Upload an image or video to the backend (Cloudinary or local fallback).
 */
export async function uploadMedia(
  file: File,
  folder = 'general',
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

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
}
