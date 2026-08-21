import axios from 'axios';
import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from 'lucide-react';
import { api } from './api';

type AuthUser = { id?: number | string; name?: string; email?: string };
type AuthMode = 'login' | 'register';
type AuthDialogState = { open: boolean; mode: AuthMode; redirectTo?: string };

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

function payloadValue(payload: unknown, key: string): unknown {
  if (!payload || typeof payload !== 'object') return undefined;
  const root = payload as Record<string, unknown>;
  const nested = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : undefined;
  return root[key] ?? nested?.[key];
}

function extractToken(payload: unknown): string | null {
  const value = payloadValue(payload, 'token') ?? payloadValue(payload, 'access_token');
  return typeof value === 'string' && value ? value : null;
}

function extractUser(payload: unknown): AuthUser | null {
  const value = payloadValue(payload, 'user');
  return value && typeof value === 'object' ? value as AuthUser : null;
}

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

export function AuthForm({ initialMode = 'login', redirectTo }: { initialMode?: AuthMode; redirectTo?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openAuth, closeAuth, setSession } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && location.pathname === '/auth') navigate(redirectTo || '/', { replace: true });
  }, [user, location.pathname, navigate, redirectTo]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(mode === 'login' ? '/login' : '/register', mode === 'login' ? { email, password } : { name, email, password, password_confirmation: confirmPassword });
      const nextToken = extractToken(response.data);
      const nextUser = extractUser(response.data);
      if (!nextToken) throw new Error('The server did not return a login session.');
      setSession(nextToken, nextUser);
      setSuccess(mode === 'register' ? 'Account created successfully.' : 'Signed in successfully.');
      window.setTimeout(() => {
        closeAuth();
        navigate(redirectTo || '/', { replace: true });
      }, 900);
    } catch (cause) {
      if (axios.isAxiosError(cause)) {
        const data = cause.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
        const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
        setError(firstFieldError || data?.message || 'Unable to sign in right now. Please try again.');
      } else setError(cause instanceof Error ? cause.message : 'Unable to sign in right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="auth-card">
    <div className="auth-card-heading"><span className="eyebrow">Yangon TV account</span><h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p>{mode === 'login' ? 'Sign in to continue watching movies and series.' : 'Join Yangon TV to unlock the player experience.'}</p></div>
    <div className="auth-tabs" role="tablist" aria-label="Authentication mode"><button type="button" className={mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'} onClick={() => switchMode('login')} role="tab" aria-selected={mode === 'login'}>Sign in</button><button type="button" className={mode === 'register' ? 'auth-tab auth-tab--active' : 'auth-tab'} onClick={() => switchMode('register')} role="tab" aria-selected={mode === 'register'}>Sign up</button></div>
    <form className="auth-form" onSubmit={submit}>
      {mode === 'register' && <label><span>Display name</span><div className="auth-input"><UserRound size={17} /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required placeholder="Your name" /></div></label>}
      <label><span>Email address</span><div className="auth-input"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" /></div></label>
      <label><span>Password</span><div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} placeholder="At least 8 characters" /><button type="button" className="auth-input-action" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      {mode === 'register' && <label><span>Confirm password</span><div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} placeholder="Repeat your password" /></div></label>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {success && <div className="auth-success" role="status"><CheckCircle2 size={18} /><div><strong>{success}</strong><span>Redirecting you now…</span></div></div>}
      <button className="button button--primary auth-submit" type="submit" disabled={submitting || Boolean(success)}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button>
    </form>
    <p className="auth-switch">{mode === 'login' ? 'New to Yangon TV?' : 'Already have an account?'} <button type="button" onClick={() => { const next = mode === 'login' ? 'register' : 'login'; switchMode(next); openAuth(next, redirectTo); }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
  </div>;
}

export function AuthDialog() {
  const { dialog, closeAuth } = useAuth();
  if (!dialog.open) return null;
  return <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuth(); }}><div className="auth-dialog" role="dialog" aria-modal="true" aria-label="Sign in to continue"><button className="icon-button auth-dialog-close" type="button" onClick={closeAuth} aria-label="Close authentication dialog"><X size={19} /></button><div className="auth-dialog-mark"><CheckCircle2 size={20} /></div><AuthForm initialMode={dialog.mode} redirectTo={dialog.redirectTo} /></div></div>;
}
