import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';

export type AuthUser = { id?: number | string; name?: string; email?: string };
export type AuthMode = 'login' | 'register';
export type AuthDialogState = { open: boolean; mode: AuthMode; redirectTo?: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  dialog: AuthDialogState;
  openAuth: (mode?: AuthMode, redirectTo?: string) => void;
  closeAuth: () => void;
  signOut: () => void;
  setSession: (token: string, user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenKey = 'yangon-tv-web-token';
const userKey = 'yangon-tv-web-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(tokenKey));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const value = window.localStorage.getItem(userKey);
      return value ? JSON.parse(value) as AuthUser : null;
    } catch {
      return null;
    }
  });
  const [dialog, setDialog] = useState<AuthDialogState>({ open: false, mode: 'login' });
  const [loading] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setToken(window.localStorage.getItem(tokenKey));
      try {
        const value = window.localStorage.getItem(userKey);
        setUser(value ? JSON.parse(value) as AuthUser : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('yangon-tv-auth-changed', syncAuthState);
    return () => window.removeEventListener('yangon-tv-auth-changed', syncAuthState);
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      const currentToken = window.localStorage.getItem(tokenKey);
      if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, []);

  function openAuth(mode: AuthMode = 'login', redirectTo?: string) {
    setDialog({ open: true, mode, redirectTo });
  }

  function closeAuth() {
    setDialog((current) => ({ ...current, open: false }));
  }

  function setSession(nextToken: string, nextUser: AuthUser | null) {
    window.localStorage.setItem(tokenKey, nextToken);
    if (nextUser) window.localStorage.setItem(userKey, JSON.stringify(nextUser));
    else window.localStorage.removeItem(userKey);
    setToken(nextToken);
    setUser(nextUser);
    window.dispatchEvent(new Event('yangon-tv-auth-changed'));
  }

  function signOut() {
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('yangon-tv-auth-changed'));
  }

  const value = useMemo(() => ({ user, token, loading, dialog, openAuth, closeAuth, signOut, setSession }), [user, token, loading, dialog]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
