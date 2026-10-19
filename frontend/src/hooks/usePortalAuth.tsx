import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { portalApi, type PortalUser } from '@/services/portal/portalService';
import { setPortalToken } from '@/services/api/client';

interface PortalAuthContextValue {
  user: PortalUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeActivation: (user: PortalUser, token: string) => void;
  logout: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(undefined);

const PORTAL_USER_KEY = 'kadamba_portal_user';

function loadPortalUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(PORTAL_USER_KEY);
    return raw ? (JSON.parse(raw) as PortalUser) : null;
  } catch {
    return null;
  }
}

function cachePortalUser(user: PortalUser | null) {
  try {
    if (user) localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(PORTAL_USER_KEY);
  } catch {
    // Private browsing / quota — not fatal.
  }
}

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(loadPortalUser);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((next: PortalUser | null) => {
    setUser(next);
    cachePortalUser(next);
  }, []);

  // Silent restore from the httpOnly portal refresh cookie.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await portalApi.refresh();
        if (cancelled) return;
        if (response?.user) applyUser(response.user);
        else applyUser(null);
      } catch {
        if (!cancelled) {
          setPortalToken(null);
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
    async (email: string, password: string) => {
      const data = await portalApi.login({ email, password });
      setPortalToken(data.token);
      applyUser(data.user);
    },
    [applyUser],
  );

  const completeActivation = useCallback(
    (nextUser: PortalUser, token: string) => {
      setPortalToken(token);
      applyUser(nextUser);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await portalApi.logout();
    } finally {
      setPortalToken(null);
      applyUser(null);
    }
  }, [applyUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      completeActivation,
      logout,
    }),
    [user, loading, login, completeActivation, logout],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return ctx;
}
