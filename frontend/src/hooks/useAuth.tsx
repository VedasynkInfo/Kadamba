import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/services/auth/authService';
import type { LoginCredentials, RegisterPayload, UpdateProfilePayload, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('kadamba_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }
      localStorage.setItem('kadamba_token', response.data.token);
      localStorage.setItem('kadamba_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (err) {
      // Dev-only console unlock when the API is offline. Never active in a
      // production build, and additionally gated behind an explicit opt-in flag.
      const demoEmail = 'admin@kadamba.local';
      const demoPass = 'kadamba123';
      if (
        import.meta.env.DEV &&
        import.meta.env.VITE_ENABLE_DEMO_ADMIN === 'true' &&
        credentials.email.trim().toLowerCase() === demoEmail &&
        credentials.password === demoPass
      ) {
        const demoUser: User = {
          id: 'demo-admin',
          name: 'Studio Admin',
          email: demoEmail,
          role: 'admin',
        };
        localStorage.setItem('kadamba_token', 'demo-admin-token');
        localStorage.setItem('kadamba_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }
      throw err instanceof Error ? err : new Error('Login failed');
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    localStorage.setItem('kadamba_token', response.data.token);
    localStorage.setItem('kadamba_user', JSON.stringify(response.data.user));
    setUser(response.data.user);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const response = await authApi.updateProfile(payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Profile update failed');
    }
    localStorage.setItem('kadamba_token', response.data.token);
    localStorage.setItem('kadamba_user', JSON.stringify(response.data.user));
    setUser(response.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kadamba_token');
    localStorage.removeItem('kadamba_user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, login, register, updateProfile, logout],
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
