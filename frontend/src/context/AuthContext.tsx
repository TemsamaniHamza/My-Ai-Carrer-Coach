'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, refreshAccessToken, setAccessToken } from '@/lib/api';
import { UpdateProfileInput, UserProfile } from '@/types/user';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean; // true only during the initial silent-refresh check
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  // Re-fetches /users/me into context state. Needed for fields the backend
  // updates as a side effect of something else (e.g. strengthsWeaknesses
  // after a completed interview) — those don't come back from that other
  // request, so the in-memory user would otherwise stay stale until the
  // next full page load.
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app load there's no access token in memory yet (page was refreshed,
  // or this is a brand-new tab) — try the httpOnly refresh cookie once to
  // silently restore the session before rendering protected content.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        // Goes through the same deduped helper the axios interceptor uses,
        // so a StrictMode double-mount (or a second tab refreshing at the
        // same moment) can't race two rotations against each other.
        const token = await refreshAccessToken();
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        const meRes = await api.get<UserProfile>('/auth/me');
        if (!cancelled) setUser(meRes.data);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; name: string }) => {
      await api.post('/auth/register', data);
    },
    [],
  );

  const login = useCallback(async (data: { email: string; password: string }) => {
    const res = await api.post<{ accessToken: string; user: UserProfile }>(
      '/auth/login',
      data,
    );
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    const res = await api.patch<UserProfile>('/users/me', data);
    setUser(res.data);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get<UserProfile>('/auth/me');
    setUser(res.data);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, register, login, logout, updateProfile, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
