import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getTvProfile, redeemPrepaidCode } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { TvProfileData } from '../lib/types';

function remainingTerm(validUntil: string | null | undefined): string {
  if (!validUntil) return 'No active premium term';
  const remainingDays = Math.max(0, Math.ceil((Date.parse(validUntil) - Date.now()) / 86_400_000));
  if (remainingDays === 0) return 'Expires today';
  if (remainingDays === 1) return '1 day remaining';
  if (remainingDays < 30) return `${remainingDays} days remaining`;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  return days ? `${months} months ${days} days remaining` : `${months} months remaining`;
}

function formatDate(value?: string | null): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();
  const [profile, setProfile] = useState<TvProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    getTvProfile()
      .then((nextProfile) => {
        if (!mounted) return;
        setProfile(nextProfile);
      })
      .catch((reason) => {
        if (!mounted) return;
        const status = (reason as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          signOut();
          navigate('/auth', { replace: true });
          return;
        }
        setError('Profile information is temporarily unavailable. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [navigate, token]);

  const displayName = profile?.profile.display_name || profile?.user.name || user?.name || 'Name unavailable';
  const email = profile?.user.email || user?.email || 'Email unavailable';
  const entitlement = profile?.entitlement;
  const isPremium = Boolean(entitlement?.active);
  const term = useMemo(() => remainingTerm(entitlement?.valid_until), [entitlement?.valid_until]);
  const membershipLabel = isPremium ? 'Lifetime' : 'Subscription';

  async function redeem() {
    const code = redeemCode.trim();
    if (!code) return;
    setRedeeming(true);
    setRedeemMessage('');
    try {
      await redeemPrepaidCode(code);
      setRedeemCode('');
      setRedeemMessage('Subscription redeemed successfully.');
      const nextProfile = await getTvProfile();
      setProfile(nextProfile);
    } catch (reason) {
      const response = (reason as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
      const fieldError = response?.data?.errors ? Object.values(response.data.errors).flat()[0] : undefined;
      setRedeemMessage(fieldError || response?.data?.message || 'This redeem code could not be applied.');
    } finally {
      setRedeeming(false);
    }
  }

  if (!token) return <Navigate to="/auth" replace />;

  return <section className="profile-page container">
    <div className="profile-heading"><div><span className="eyebrow">Yangon TV account</span><h1>Your profile</h1><p>View your account identity and access status.</p></div></div>
    {error && <div className="profile-alert" role="alert"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="profile-loading" role="status">Loading your profile…</div> : <>
      <div className="profile-grid">
        <article className="profile-identity profile-card">
          <div className="profile-avatar"><UserRound size={30} /></div>
          <div className="profile-identity-copy"><h2>{displayName} {profile?.user.uid && <span className="profile-uid">UID {profile.user.uid}</span>} <span className={isPremium ? 'profile-badge profile-badge--premium' : 'profile-badge'}><BadgeCheck size={14} /> {membershipLabel}</span></h2><p>{email}</p><span className="profile-role"><ShieldCheck size={13} /> {profile?.user.role ? profile.user.role : 'Account'}</span></div>
        </article>
        <article className={isPremium ? 'profile-card premium-card premium-card--active' : 'profile-card premium-card'}>
          <div className="premium-icon" aria-label="Subscription lifetime"><Clock3 size={24} /></div>
          <div><span className="profile-card-label">Subscription Lifetime</span><h2>{isPremium ? term : 'No active subscription'}</h2><p>{entitlement?.valid_until ? `Valid until ${formatDate(entitlement.valid_until)}` : 'Choose a subscription plan to activate lifetime access.'}</p></div>
          <span className={isPremium ? 'premium-state premium-state--active' : 'premium-state'}>{isPremium ? 'Active' : 'Inactive'}</span>
        </article>
      </div>
      <article className="profile-card redeem-card"><div className="profile-section-icon"><KeyRound size={19} /></div><div className="redeem-card__copy"><span className="profile-card-label">Redeem Code</span><h2>Redeem Code</h2><p>Enter your redeem code to activate or extend your subscription.</p><div className="redeem-form"><input value={redeemCode} onChange={(event) => setRedeemCode(event.target.value.toUpperCase())} placeholder="Enter redeem code" aria-label="Redeem code" autoComplete="off" /><button className="button button--primary" type="button" onClick={redeem} disabled={redeeming || !redeemCode.trim()}><KeyRound size={15} />{redeeming ? 'Redeeming…' : 'Redeem'}</button></div>{redeemMessage && <p className={redeemMessage.includes('successfully') ? 'redeem-message redeem-message--success' : 'redeem-message'} role="status">{redeemMessage.includes('successfully') && <CheckCircle2 size={14} />}{redeemMessage}</p>}</div></article>
      <button className="profile-logout profile-logout--bottom" type="button" onClick={() => { signOut(); navigate('/auth', { replace: true }); }}><LogOut size={16} /> Log out</button>
    </>}
  </section>;
}
