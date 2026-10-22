import { adminApi, setAdminToken } from '../api/client';
import type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types';

interface LoginPayload {
  user?: User;
  token?: string;
  expiresIn?: number;
  mfaRequired?: boolean;
  mfaTicket?: string;
}

/**
 * The refresh request currently in flight, if any.
 *
 * The server rotates the refresh token on every use, so two concurrent
 * refreshes invalidate each other. Sharing one promise means there is only
 * ever one.
 */
let refreshInFlight: Promise<ApiResponse<LoginPayload>> | null = null;

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await adminApi.post<ApiResponse<LoginPayload>>('/auth/login', credentials);
    if (data.data?.token) setAdminToken(data.data.token);
    return data;
  },

  /** Complete the second factor for accounts with TOTP enabled. */
  verifyMfa: async (payload: { mfaTicket: string; code?: string; recoveryCode?: string }) => {
    const { data } = await adminApi.post<ApiResponse<LoginPayload>>('/auth/login/mfa', payload);
    if (data.data?.token) setAdminToken(data.data.token);
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await adminApi.post<ApiResponse<{ user: User } & AuthTokens>>(
      '/auth/register',
      payload,
    );
    return data;
  },

  me: async () => {
    const { data } = await adminApi.get<ApiResponse<{ user: User }>>('/auth/me');
    return data;
  },

  /**
   * Uses the httpOnly refresh cookie; no token is passed from JS.
   *
   * The refresh token is *rotated* on every use: the server issues a new one
   * and invalidates the old. That makes concurrent refreshes fatal — two
   * calls with the same cookie value mean the second one presents a token
   * that has already been replaced, and the session is signed out.
   *
   * So a refresh is single-flighted: the first caller starts the request and
   * everybody who asks while it is in flight is given the same promise. A
   * remount, a hot reload, or two components racing to restore the session
   * all end up as one request.
   */
  refresh: async () => {
    if (!refreshInFlight) {
      refreshInFlight = adminApi
        .post<ApiResponse<LoginPayload>>('/auth/refresh')
        .then(({ data }) => {
          if (data.data?.token) setAdminToken(data.data.token);
          return data;
        })
        .finally(() => {
          refreshInFlight = null;
        });
    }
    return refreshInFlight;
  },

  logout: async () => {
    try {
      await adminApi.post('/auth/logout');
    } finally {
      setAdminToken(null);
    }
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await adminApi.patch<ApiResponse<LoginPayload>>('/auth/profile', payload);
    if (data.data?.token) setAdminToken(data.data.token);
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await adminApi.post<
      ApiResponse<{ devToken?: string } | undefined>
    >('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (payload: { token: string; password: string }) => {
    const { data } = await adminApi.post<ApiResponse>('/auth/reset-password', payload);
    return data;
  },

  /* ------------------------------------------------------------------ */
  /* Two-factor authentication                                          */
  /* ------------------------------------------------------------------ */

  mfaStatus: async () => {
    const { data } = await adminApi.get<ApiResponse<{ enabled: boolean }>>('/auth/mfa');
    return data;
  },

  mfaEnrollStart: async () => {
    const { data } = await adminApi.post<
      ApiResponse<{ secret: string; otpauthUri: string }>
    >('/auth/mfa/enroll');
    return data;
  },

  mfaEnrollConfirm: async (code: string) => {
    const { data } = await adminApi.post<
      ApiResponse<{ enabled: boolean; backupCodes: string[] }>
    >('/auth/mfa/enroll/confirm', { code });
    return data;
  },

  mfaDisable: async (payload: { password: string; code: string }) => {
    const { data } = await adminApi.post<ApiResponse>('/auth/mfa/disable', payload);
    setAdminToken(null);
    return data;
  },

  mfaBackupCodes: async (password: string) => {
    const { data } = await adminApi.post<ApiResponse<{ backupCodes: string[] }>>(
      '/auth/mfa/backup-codes',
      { password },
    );
    return data;
  },

  /* ------------------------------------------------------------------ */
  /* Sessions                                                           */
  /* ------------------------------------------------------------------ */

  sessions: async () => {
    const { data } = await adminApi.get<
      ApiResponse<{
        items: Array<{
          id: string;
          familyId: string;
          current: boolean;
          createdAt: string;
          lastUsedAt: string;
          userAgent?: string;
          ip?: string;
          expiresAt: string;
        }>;
      }>
    >('/auth/sessions');
    return data;
  },

  revokeSession: async (familyId: string) => {
    const { data } = await adminApi.delete<ApiResponse>(`/auth/sessions/${familyId}`);
    return data;
  },

  revokeAllSessions: async () => {
    const { data } = await adminApi.post<ApiResponse>('/auth/sessions/revoke-all');
    setAdminToken(null);
    return data;
  },
};
