import api from '../api/client';
import type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<{ user: User } & AuthTokens>>(
      '/auth/login',
      credentials,
    );
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<ApiResponse<{ user: User } & AuthTokens>>(
      '/auth/register',
      payload,
    );
    return data;
  },

  me: async () => {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return data;
  },

  refresh: async () => {
    const { data } = await api.post<ApiResponse<{ user: User } & AuthTokens>>('/auth/refresh');
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch<ApiResponse<{ user: User } & AuthTokens>>(
      '/auth/profile',
      payload,
    );
    return data;
  },
};
