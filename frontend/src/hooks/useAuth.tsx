import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/services/auth/authService';
import { setAdminToken } from '@/services/api/client';
import type { LoginCredentials, RegisterPayload, UpdateProfilePayload, User } from '@/types';

interface MfaChallenge {
  ticket: string;
  user: { id: string; name: string; email: string };
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the initial session restore is in flight. */
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Present when login returned an MFA challenge. */
  mfaChallenge: MfaChallenge | null;
  completeMfa: (code: string) => Promise<void>;
  cancelMfa: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** The user profile is not secret — persisting it avoids a blank flash. */
const USER_CACHE_KEY = 'kadamba_user';

function loadCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Private browsing / quota — not fatal.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadCachedUser);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    cacheUser(next);
  }, []);

  /**
   * On first load the access token is gone (memory only), but the httpOnly
   * refresh cookie may still be valid. Try one silent refresh so a page reload
   * does not sign the admin out.
   */
  useEffect(() => {
    let cancelled = false;

    // Public pages have no admin session to restore. Firing the refresh there
    // guaranteed a 401 on every cold load, polluted the console and spent the
    // refresh budget that a real console session needs. The portal provider
    // already gates on `/portal`; the admin provider now does the same.
    if (typeof window === 'undefined' || !window.location.pathname.startsWith('/admin')) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const response = await authApi.refresh();
        if (cancelled) return;
        if (response.success && response.data?.user) {
          applyUser(response.data.user);
        } else {
          applyUser(null);
        }
      } catch {
        if (!cancelled) {
          setAdminToken(null);
          applyUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      if (response.data?.mfaRequired && response.data.mfaTicket) {
        setMfaChallenge({
          ticket: response.data.mfaTicket,
          user: response.data.user as MfaChallenge['user'],
        });
        return;
      }

      if (!response.data?.user) {
        throw new Error(response.message || 'Login failed');
      }
      setMfaChallenge(null);
      applyUser(response.data.user);
    },
    [applyUser],
  );

  const completeMfa = useCallback(
    async (code: string) => {
      if (!mfaChallenge) throw new Error('No verification in progress');
      const response = await authApi.verifyMfa({
        mfaTicket: mfaChallenge.ticket,
        // A 6-digit code is a TOTP; anything else is treated as a recovery code.
        ...(/^\d{6}$/.test(code.trim())
          ? { code: code.trim() }
          : { recoveryCode: code.trim() }),
      });
      if (!response.success || !response.data?.user) {
        throw new Error(response.message || 'Verification failed');
      }
      setMfaChallenge(null);
      applyUser(response.data.user);
    },
    [mfaChallenge, applyUser],
  );

  const cancelMfa = useCallback(() => setMfaChallenge(null), []);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }
      applyUser(response.data.user);
    },
    [applyUser],
  );

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      const response = await authApi.updateProfile(payload);
      if (!response.success || !response.data?.user) {
        throw new Error(response.message || 'Profile update failed');
      }
      applyUser(response.data.user);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAdminToken(null);
      setMfaChallenge(null);
      applyUser(null);
    }
  }, [applyUser]);

  const refreshUser = useCallback(async () => {
    const response = await authApi.me();
    if (response.success && response.data?.user) {
      applyUser(response.data.user);
    }
  }, [applyUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      mfaChallenge,
      completeMfa,
      cancelMfa,
      register,
      updateProfile,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
      login,
      mfaChallenge,
      completeMfa,
      cancelMfa,
      register,
      updateProfile,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
