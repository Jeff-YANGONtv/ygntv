import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Clock3, LogOut, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getTvProfile } from '../lib/api';
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
  const pointBalance = profile?.wallet?.mode === 'prepaid' ? profile.wallet.balance_points ?? 0 : 0;
  const membershipLabel = isPremium ? 'Lifetime' : 'Point';

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
        {isPremium && <article className="profile-card premium-card premium-card--active">
          <div className="premium-icon" aria-label="Lifetime membership time"><Clock3 size={24} /></div>
          <div><span className="profile-card-label">Membership lifetime</span><h2>{term}</h2><p>{entitlement?.valid_until ? `Valid until ${formatDate(entitlement.valid_until)}` : 'Lifetime access is active.'}</p></div>
          <span className="premium-state premium-state--active">Lifetime</span>
        </article>}
      </div>
      {!isPremium && <article className="profile-card wallet-card"><div className="profile-section-icon"><WalletCards size={19} /></div><div className="wallet-card__copy"><span className="profile-card-label">Point Balance</span><h2>{pointBalance.toLocaleString()} Points</h2><p>Balance activity is available in User History.</p></div></article>}
      <button className="profile-logout profile-logout--bottom" type="button" onClick={() => { signOut(); navigate('/auth', { replace: true }); }}><LogOut size={16} /> Log out</button>
    </>}
  </section>;
}
