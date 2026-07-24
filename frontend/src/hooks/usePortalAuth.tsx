import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearPortalSession,
  loadPortalUser,
  portalApi,
  storePortalSession,
  type PortalUser,
} from '@/services/portal/portalService';

interface PortalAuthContextValue {
  user: PortalUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeActivation: (user: PortalUser, token: string) => void;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(loadPortalUser);

  const login = useCallback(async (email: string, password: string) => {
    const data = await portalApi.login({ email, password });
    storePortalSession(data.user, data.token);
    setUser(data.user);
  }, []);

  const completeActivation = useCallback((nextUser: PortalUser, token: string) => {
    storePortalSession(nextUser, token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearPortalSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      completeActivation,
      logout,
    }),
    [user, login, completeActivation, logout],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return ctx;
}
