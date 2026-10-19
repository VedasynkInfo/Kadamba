import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Two API clients, one per audience.
 *
 * Previously a single instance guessed which token to attach by inspecting the
 * URL (`/portal`, `/customer-auth`), which is fragile: any new route silently
 * picks the wrong credential. Now the *call site* chooses the client, so an
 * admin request can never accidentally carry a customer token.
 *
 * Token strategy
 * --------------
 * Access tokens live in memory only (never localStorage), so an XSS payload
 * cannot read a long-lived credential. The refresh token is an httpOnly cookie
 * scoped to `/api/auth` (admin) or `/api/portal` (customer) and is therefore
 * invisible to JavaScript. On a 401 we transparently refresh once and replay
 * the original request; concurrent 401s share a single refresh promise.
 */

export const ADMIN_TOKEN_KEY = 'kadamba_admin_access_token';
export const PORTAL_TOKEN_KEY = 'kadamba_portal_access_token';

let adminToken: string | null = null;
let portalToken: string | null = null;

export function setAdminToken(token: string | null) {
  adminToken = token;
}

export function setPortalToken(token: string | null) {
  portalToken = token;
}

export function getAdminToken() {
  return adminToken;
}

export function getPortalToken() {
  return portalToken;
}

const baseConfig = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  // Render free-tier cold starts can exceed 15s; keep headroom for first wake.
  timeout: 45000,
  // Required so the httpOnly refresh cookie is sent on /auth and /portal calls.
  withCredentials: true,
};

export const adminApi = axios.create(baseConfig);
export const portalApi = axios.create(baseConfig);

type Audience = 'admin' | 'portal';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
  _skipAuthRefresh?: boolean;
}

const refreshPaths: Record<Audience, string> = {
  admin: '/auth/refresh',
  portal: '/portal/refresh',
};

let adminRefreshPromise: Promise<string | null> | null = null;
let portalRefreshPromise: Promise<string | null> | null = null;

/**
 * Ask the server for a new access token using the httpOnly cookie.
 * Returns the new token, or null when the session is genuinely over.
 */
async function performRefresh(audience: Audience): Promise<string | null> {
  try {
    const { data } = await (audience === 'admin' ? adminApi : portalApi).post(
      refreshPaths[audience],
      {},
      { _skipAuthRefresh: true } as RetriableConfig,
    );
    const token = (data as { data?: { token?: string } })?.data?.token ?? null;
    if (audience === 'admin') setAdminToken(token);
    else setPortalToken(token);
    return token;
  } catch {
    if (audience === 'admin') setAdminToken(null);
    else setPortalToken(null);
    return null;
  }
}

function refreshOnce(audience: Audience): Promise<string | null> {
  if (audience === 'admin') {
    if (!adminRefreshPromise) {
      adminRefreshPromise = performRefresh('admin').finally(() => {
        adminRefreshPromise = null;
      });
    }
    return adminRefreshPromise;
  }
  if (!portalRefreshPromise) {
    portalRefreshPromise = performRefresh('portal').finally(() => {
      portalRefreshPromise = null;
    });
  }
  return portalRefreshPromise;
}

function attachAuth(api: typeof adminApi, audience: Audience) {
  api.interceptors.request.use((config) => {
    const token = audience === 'admin' ? adminToken : portalToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const url = config?.url ?? '';

      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password') ||
        url.includes('/portal/login') ||
        url.includes('/portal/refresh') ||
        url.includes('/portal/activate');

      // One transparent refresh attempt per request.
      if (status === 401 && config && !config._retried && !config._skipAuthRefresh && !isAuthEndpoint) {
        config._retried = true;
        const token = await refreshOnce(audience);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return api.request(config);
        }
      }

      // Session is over — clear the in-memory token and route to sign-in.
      if (status === 401 && !isAuthEndpoint) {
        if (audience === 'admin') {
          setAdminToken(null);
          const path = window.location.pathname;
          if (path.startsWith('/admin') && path !== '/admin/login') {
            window.location.assign('/admin/login');
          }
        } else {
          setPortalToken(null);
          const path = window.location.pathname;
          if (path.startsWith('/portal') && path !== '/portal/login' && path !== '/portal/activate') {
            window.location.assign('/portal/login');
          }
        }
      }

      return Promise.reject(error);
    },
  );
}

attachAuth(adminApi, 'admin');
attachAuth(portalApi, 'portal');

/** Backwards-compatible default: the admin console client. */
const api = adminApi;
export default api;
