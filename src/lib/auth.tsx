import axios from 'axios';
import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Chrome, Eye, EyeOff, LockKeyhole, Mail, Send, UserRound, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: Record<string, unknown>) => void } } };
    onTelegramAuth?: (user: TelegramLoginUser) => void;
  }
}

type TelegramLoginUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string };
type AuthUser = { id?: number | string; name?: string; email?: string };
type AuthMode = 'login' | 'register';
type AuthDialogState = { open: boolean; mode: AuthMode; redirectTo?: string };
type AuthContextValue = { user: AuthUser | null; token: string | null; loading: boolean; dialog: AuthDialogState; openAuth: (mode?: AuthMode, redirectTo?: string) => void; closeAuth: () => void; signOut: () => void; setSession: (token: string, user: AuthUser | null) => void };

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenKey = 'yangon-tv-web-token';
const userKey = 'yangon-tv-web-user';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;

function payloadValue(payload: unknown, key: string): unknown {
  if (!payload || typeof payload !== 'object') return undefined;
  const root = payload as Record<string, unknown>;
  const nested = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : undefined;
  return root[key] ?? nested?.[key];
}
function extractToken(payload: unknown): string | null { const value = payloadValue(payload, 'token') ?? payloadValue(payload, 'access_token'); return typeof value === 'string' && value ? value : null; }
function extractUser(payload: unknown): AuthUser | null { const value = payloadValue(payload, 'user'); return value && typeof value === 'object' ? value as AuthUser : null; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(tokenKey));
  const [user, setUser] = useState<AuthUser | null>(() => { try { const value = window.localStorage.getItem(userKey); return value ? JSON.parse(value) as AuthUser : null; } catch { return null; } });
  const [dialog, setDialog] = useState<AuthDialogState>({ open: false, mode: 'login' });
  const [loading] = useState(false);
  useEffect(() => { const sync = () => { setToken(window.localStorage.getItem(tokenKey)); try { const value = window.localStorage.getItem(userKey); setUser(value ? JSON.parse(value) as AuthUser : null); } catch { setUser(null); } }; window.addEventListener('yangon-tv-auth-changed', sync); return () => window.removeEventListener('yangon-tv-auth-changed', sync); }, []);
  useEffect(() => { const interceptor = api.interceptors.request.use((config) => { const currentToken = window.localStorage.getItem(tokenKey); if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`; return config; }); return () => api.interceptors.request.eject(interceptor); }, []);
  function openAuth(mode: AuthMode = 'login', redirectTo?: string) { setDialog({ open: true, mode, redirectTo }); }
  function closeAuth() { setDialog((current) => ({ ...current, open: false })); }
  function setSession(nextToken: string, nextUser: AuthUser | null) { window.localStorage.setItem(tokenKey, nextToken); if (nextUser) window.localStorage.setItem(userKey, JSON.stringify(nextUser)); else window.localStorage.removeItem(userKey); setToken(nextToken); setUser(nextUser); window.dispatchEvent(new Event('yangon-tv-auth-changed')); }
  function signOut() { window.localStorage.removeItem(tokenKey); window.localStorage.removeItem(userKey); setToken(null); setUser(null); window.dispatchEvent(new Event('yangon-tv-auth-changed')); }
  const value = useMemo(() => ({ user, token, loading, dialog, openAuth, closeAuth, signOut, setSession }), [user, token, loading, dialog]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }

function SocialAuthButtons({ onSuccess, onError }: { onSuccess: (payload: unknown, provider: string) => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    const telegramCallback = (user: TelegramLoginUser) => { setBusy(true); api.post('/auth/telegram/web', user).then((response) => onSuccess(response.data, 'Telegram')).catch(() => onError('Telegram sign-in could not be completed.')).finally(() => setBusy(false)); };
    window.onTelegramAuth = telegramCallback;
    if (googleClientId) {
      script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.onload = () => { const target = document.getElementById('google-login-button'); if (target && window.google) { window.google.accounts.id.initialize({ client_id: googleClientId, callback: (response) => { setBusy(true); api.post('/auth/google/web', { credential: response.credential }).then((result) => onSuccess(result.data, 'Google')).catch(() => onError('Google sign-in could not be completed.')).finally(() => setBusy(false)); } }); window.google.accounts.id.renderButton(target, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' }); } }; document.head.appendChild(script);
    }
    return () => { if (script) script.remove(); delete window.onTelegramAuth; };
  }, [onError, onSuccess]);
  return <div className="auth-socials" aria-label="Social sign-in options">
    <div id="google-login-button" className="auth-social-google">{!googleClientId && <button type="button" className="button button--outline auth-social-button" disabled><Chrome size={17} /> Google login is not configured</button>}</div>
    {telegramBotUsername ? <div className="auth-telegram-widget"><script async src="https://telegram.org/js/telegram-widget.js?22" data-telegram-login={telegramBotUsername.replace(/^@/, '')} data-size="large" data-userpic="false" data-onauth="onTelegramAuth(user)" data-request-access="write" /></div> : <button type="button" className="button button--outline auth-social-button" disabled={busy}><Send size={17} /> Telegram login is not configured</button>}
  </div>;
}

export function AuthForm({ initialMode = 'login', redirectTo }: { initialMode?: AuthMode; redirectTo?: string }) {
  const navigate = useNavigate(); const location = useLocation(); const { user, openAuth, closeAuth, setSession } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { if (user && location.pathname === '/auth' && !success) navigate(redirectTo || '/', { replace: true }); }, [user, location.pathname, navigate, redirectTo, success]);
  function switchMode(next: AuthMode) { setMode(next); setError(''); setSuccess(''); if (next === 'login') setConfirmPassword(''); }
  function socialSuccess(payload: unknown, provider: string) { const nextToken = extractToken(payload); if (!nextToken) { setError('The server did not return a login session.'); return; } setSession(nextToken, extractUser(payload)); setSuccess(`${provider} sign-in successful.`); window.setTimeout(() => { closeAuth(); navigate(redirectTo || '/', { replace: true }); }, 900); }
  const socialError = (message: string) => setError(message);
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setSuccess(''); if (mode === 'register' && password !== confirmPassword) { setError('Passwords do not match.'); return; } setSubmitting(true); try { const response = await api.post(mode === 'login' ? '/login' : '/register', mode === 'login' ? { email, password } : { name, email, password, password_confirmation: confirmPassword }); const nextToken = extractToken(response.data); if (!nextToken) throw new Error('The server did not return a login session.'); setSession(nextToken, extractUser(response.data)); setSuccess(mode === 'register' ? 'Account created successfully.' : 'Signed in successfully.'); window.setTimeout(() => { closeAuth(); navigate(redirectTo || '/', { replace: true }); }, 900); } catch (cause) { if (axios.isAxiosError(cause)) { const data = cause.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined; const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined; setError(firstFieldError || data?.message || 'Unable to sign in right now. Please try again.'); } else setError(cause instanceof Error ? cause.message : 'Unable to sign in right now. Please try again.'); } finally { setSubmitting(false); } }
  return <div className="auth-card">
    <div className="auth-card-heading"><span className="eyebrow">Yangon TV account</span><h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p>{mode === 'login' ? 'Sign in to continue watching movies and series.' : 'Join Yangon TV to unlock the player experience.'}</p></div>
    <div className="auth-tabs" role="tablist" aria-label="Authentication mode"><button type="button" className={mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'} onClick={() => switchMode('login')} role="tab" aria-selected={mode === 'login'}>Sign in</button><button type="button" className={mode === 'register' ? 'auth-tab auth-tab--active' : 'auth-tab'} onClick={() => switchMode('register')} role="tab" aria-selected={mode === 'register'}>Sign up</button></div>
    <SocialAuthButtons onSuccess={socialSuccess} onError={socialError} />
    <div className="auth-divider"><span>or continue with email</span></div>
    <form className="auth-form" onSubmit={submit}>{mode === 'register' && <label><span>Display name</span><div className="auth-input"><UserRound size={17} /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required placeholder="Your name" /></div></label>}<label><span>Email address</span><div className="auth-input"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" /></div></label><label><span>Password</span><div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} placeholder="At least 8 characters" /><button type="button" className="auth-input-action" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{mode === 'register' && <label><span>Confirm password</span><div className={password !== confirmPassword && confirmPassword.length > 0 ? 'auth-input auth-input--invalid' : 'auth-input'}><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} placeholder="Repeat your password" /></div></label>}{error && <div className="auth-error" role="alert">{error}</div>}{success && <div className="auth-success" role="status"><CheckCircle2 size={18} /><div><strong>{success}</strong><span>Redirecting you now…</span></div></div>}<button className="button button--primary auth-submit" type="submit" disabled={submitting || Boolean(success)}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form>
    <p className="auth-switch">{mode === 'login' ? 'New to Yangon TV?' : 'Already have an account?'} <button type="button" onClick={() => { const next = mode === 'login' ? 'register' : 'login'; switchMode(next); openAuth(next, redirectTo); }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
  </div>;
}

export function AuthDialog() { const { dialog, closeAuth } = useAuth(); if (!dialog.open) return null; return <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuth(); }}><div className="auth-dialog" role="dialog" aria-modal="true" aria-label="Sign in to continue"><button className="icon-button auth-dialog-close" type="button" onClick={closeAuth} aria-label="Close authentication dialog"><X size={19} /></button><div className="auth-dialog-mark"><CheckCircle2 size={20} /></div><AuthForm initialMode={dialog.mode} redirectTo={dialog.redirectTo} /></div></div>; }
