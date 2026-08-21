import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, Crown, LogOut, ReceiptText, ShieldCheck, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getPaymentOrders, getTvProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { ApiPage, PaymentOrder, TvProfileData } from '../lib/types';

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

function orderStatus(status?: string): string {
  if (!status) return 'Status unavailable';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();
  const [profile, setProfile] = useState<TvProfileData | null>(null);
  const [orders, setOrders] = useState<ApiPage<PaymentOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    Promise.allSettled([getTvProfile(), getPaymentOrders()])
      .then(([profileResult, ordersResult]) => {
        if (!mounted) return;
        if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
        else {
          const status = (profileResult.reason as { response?: { status?: number } })?.response?.status;
          if (status === 401) {
            signOut();
            navigate('/auth', { replace: true });
            return;
          }
          setError('Profile information is temporarily unavailable. Please try again.');
        }
        if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
        else setOrdersError('Purchase history is temporarily unavailable.');
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
  const membershipLabel = isPremium ? 'Premium' : 'Normal';

  if (!token) return <Navigate to="/auth" replace />;

  return <section className="profile-page container">
    <div className="profile-heading"><div><span className="eyebrow">Yangon TV account</span><h1>Your profile</h1><p>Manage your account status and payment history.</p></div><button className="profile-logout" type="button" onClick={() => { signOut(); navigate('/auth', { replace: true }); }}><LogOut size={16} /> Log out</button></div>
    {error && <div className="profile-alert" role="alert"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="profile-loading" role="status">Loading your profile…</div> : <>
      <div className="profile-grid">
        <article className="profile-identity profile-card">
          <div className="profile-avatar"><UserRound size={30} /></div>
          <div className="profile-identity-copy"><h2>{displayName} <span className={isPremium ? 'profile-badge profile-badge--premium' : 'profile-badge'}><BadgeCheck size={14} /> {membershipLabel}</span></h2><p>{email}</p><span className="profile-role"><ShieldCheck size={13} /> {profile?.user.role ? profile.user.role : 'Account'}</span></div>
        </article>
        <article className={isPremium ? 'profile-card premium-card premium-card--active' : 'profile-card premium-card'}>
          <div className="premium-icon" aria-label={isPremium ? 'Premium active' : 'Premium inactive'}><Crown size={24} /></div>
          <div><span className="profile-card-label">Membership</span><h2>{isPremium ? 'Premium' : 'Normal'}</h2><p>{isPremium ? (entitlement?.plan_label || 'Active premium access') : 'Premium access is not active'}</p></div>
          <span className={isPremium ? 'premium-state premium-state--active' : 'premium-state'}>{isPremium ? 'Active' : 'Normal'}</span>
        </article>
      </div>
      <article className="profile-card profile-term"><div className="profile-section-icon"><Clock3 size={19} /></div><div><span className="profile-card-label">Premium remaining</span><h2>{term}</h2><p>{isPremium && entitlement?.valid_until ? `Valid until ${formatDate(entitlement.valid_until)}` : 'Choose a premium plan to unlock playback.'}</p></div></article>
      <section className="profile-history"><div className="profile-section-heading"><div><span className="eyebrow">Account activity</span><h2>Purchase history</h2></div><ReceiptText size={22} /></div>{orders?.data.length ? <div className="purchase-list">{orders.data.map((order) => <article className="purchase-row" key={order.id}><div className="purchase-icon"><ReceiptText size={17} /></div><div className="purchase-main"><strong>{order.purpose || order.plan_key || 'Payment order'}</strong><span>{order.reference || `Order ${order.id}`} · {formatDate(order.created_at)}</span></div><div className="purchase-meta"><strong>{Number.isFinite(Number(order.amount_ks)) ? `${Number(order.amount_ks).toLocaleString()} Ks` : 'Amount unavailable'}</strong><span className={`purchase-status purchase-status--${order.status || 'unknown'}`}><CheckCircle2 size={12} />{orderStatus(order.status)}</span></div></article>)}</div> : <div className="profile-empty">{ordersError || 'No purchase history yet.'}</div>}</section>
    </>}
  </section>;
}
