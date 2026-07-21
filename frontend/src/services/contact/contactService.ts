import api from '../api/client';
import type { ApiResponse } from '@/types';

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

/**
 * Submit a contact-form message (email notification on the server).
 */
export async function submitContactMessage(payload: ContactPayload): Promise<void> {
  await api.post<ApiResponse>('/contact', payload);
}
