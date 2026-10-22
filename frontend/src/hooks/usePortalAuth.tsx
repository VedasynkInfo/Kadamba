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
  /**
   * Restore a portal session from the httpOnly cookie.
   *
   * The provider is mounted above the router, so it cannot know which part of
   * the application is on screen. Asking the API for a portal session on every
   * page of the public site and the console cost two requests each time, and
   * they counted against the auth rate limit that the console's own session
   * needed. The portal layout calls this when the portal is actually entered.
   */
  restore: () => Promise<void>;
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
  //
  // Only when the visitor has actually landed in the portal. The provider
  // sits above the router, so it cannot see the route — but the *document*
  // can, and a full page load into /admin or / has no portal session to
  // restore. The portal layout calls `restore()` when the portal is entered
  // from within the application.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.pathname.startsWith('/portal')) {
      setLoading(false);
      return;
    }

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

  /** Restore a portal session on demand — see the note on the context value. */
  const restore = useCallback(async () => {
    try {
      const response = await portalApi.refresh();
      if (response?.user) applyUser(response.user);
    } catch {
      setPortalToken(null);
      applyUser(null);
    } finally {
      setLoading(false);
    }
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
      restore,
    }),
    [user, loading, login, completeActivation, logout, restore],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return ctx;
}
