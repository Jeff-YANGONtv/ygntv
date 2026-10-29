import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from 'lucide-react';
import { api } from './api';
import { useAuth } from './auth';
import type { AuthMode, AuthUser } from './auth';

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
    if (user && location.pathname === '/auth' && !success) navigate(redirectTo || '/', { replace: true });
  }, [user, location.pathname, navigate, redirectTo, success]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
    setSuccess('');
    if (next === 'login') setConfirmPassword('');
  }

  const passwordsMismatch = mode === 'register' && confirmPassword.length > 0 && password !== confirmPassword;

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
      {mode === 'register' && <label><span>Confirm password</span><div className={passwordsMismatch ? 'auth-input auth-input--invalid' : 'auth-input'}><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} aria-invalid={passwordsMismatch} placeholder="Repeat your password" /></div>{passwordsMismatch && <small className="auth-field-error">Passwords do not match.</small>}</label>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {success && <div className="auth-success" role="status"><CheckCircle2 size={18} /><div><strong>{success}</strong><span>Redirecting you now…</span></div></div>}
      <button className="button button--primary auth-submit" type="submit" disabled={submitting || Boolean(success)}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button>
      {mode === 'login' && <><div className="auth-divider"><span>or</span></div><button className="button auth-google" type="button" onClick={() => { const callback = `${window.location.origin}/auth/google/callback`; const base = String(api.defaults.baseURL || '').replace(/\/$/, ''); window.location.assign(`${base}/auth/google/redirect?return_uri=${encodeURIComponent(callback)}`); }} disabled={submitting || Boolean(success)}>Continue with Google</button></>}
    </form>
    <p className="auth-switch">{mode === 'login' ? 'New to Yangon TV?' : 'Already have an account?'} <button type="button" onClick={() => { const next = mode === 'login' ? 'register' : 'login'; switchMode(next); openAuth(next, redirectTo); }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
  </div>;
}

export function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [message, setMessage] = useState('Completing Google sign-in…');
  useEffect(() => {
    const code = params.get('code');
    const error = params.get('error');
    if (error || !code) { setMessage(error || 'Google sign-in could not be completed.'); return; }
    let cancelled = false;
    api.post('/auth/google/exchange', { code }).then((response) => {
      if (cancelled) return;
      const nextToken = extractToken(response.data);
      const nextUser = extractUser(response.data);
      if (!nextToken) throw new Error('The server did not return a login session.');
      setSession(nextToken, nextUser);
      navigate('/', { replace: true });
    }).catch(() => { if (!cancelled) setMessage('Google sign-in could not be completed. Please try again.'); });
    return () => { cancelled = true; };
  }, [navigate, params, setSession]);
  return <main className="auth-page"><div className="auth-card"><div className="auth-card-heading"><span className="eyebrow">Yangon TV account</span><h1>{message}</h1><p>You can close this page if sign-in does not continue.</p></div></div></main>;
}

export function AuthDialog() {
  const { dialog, closeAuth } = useAuth();
  if (!dialog.open) return null;
  return <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuth(); }}><div className="auth-dialog" role="dialog" aria-modal="true" aria-label="Sign in to continue"><button className="icon-button auth-dialog-close" type="button" onClick={closeAuth} aria-label="Close authentication dialog"><X size={19} /></button><div className="auth-dialog-mark"><CheckCircle2 size={20} /></div><AuthForm initialMode={dialog.mode} redirectTo={dialog.redirectTo} /></div></div>;
}
