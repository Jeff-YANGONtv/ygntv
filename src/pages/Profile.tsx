import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, Crown, KeyRound, LogOut, ReceiptText, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getPaymentOrders, getTvProfile, redeemPrepaidCode } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { ApiPage, PaymentOrder, TvProfileData } from '../lib/types';
import '../styles/prepaid-access.css';

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
  const [prepaidCode, setPrepaidCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');
  const [walletError, setWalletError] = useState('');

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
  const pointBalance = profile?.wallet?.mode === 'prepaid' ? profile.wallet.balance_points ?? 0 : 0;

  async function redeemCode() {
    const code = prepaidCode.trim();
    if (!code || redeeming) return;
    setRedeeming(true);
    setWalletError('');
    setWalletMessage('');
    try {
      const redeemed = await redeemPrepaidCode(code);
      setProfile((current) => current ? {
        ...current,
        wallet: current.wallet ? { ...current.wallet, mode: 'prepaid', balance_points: redeemed.balance_points, code_redeem_available: true } : current.wallet,
      } : current);
      setPrepaidCode('');
      setWalletMessage(`${redeemed.credited_points.toLocaleString()} Points were added to your balance.`);
    } catch (cause) {
      const response = (cause as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
      const fieldError = response?.data?.errors ? Object.values(response.data.errors).flat()[0] : undefined;
      setWalletError(fieldError || response?.data?.message || 'The prepaid code could not be redeemed.');
    } finally {
      setRedeeming(false);
    }
  }

  if (!token) return <Navigate to="/auth" replace />;

  return <section className="profile-page container">
    <div className="profile-heading"><div><span className="eyebrow">Yangon TV account</span><h1>Your profile</h1><p>Manage your account status and payment history.</p></div></div>
    {error && <div className="profile-alert" role="alert"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="profile-loading" role="status">Loading your profile…</div> : <>
      <div className="profile-grid">
        <article className="profile-identity profile-card">
          <div className="profile-avatar"><UserRound size={30} /></div>
          <div className="profile-identity-copy"><h2>{displayName} {profile?.user.uid && <span className="profile-uid">UID {profile.user.uid}</span>} <span className={isPremium ? 'profile-badge profile-badge--premium' : 'profile-badge'}><BadgeCheck size={14} /> {membershipLabel}</span></h2><p>{email}</p><span className="profile-role"><ShieldCheck size={13} /> {profile?.user.role ? profile.user.role : 'Account'}</span></div>
        </article>
        <article className={isPremium ? 'profile-card premium-card premium-card--active' : 'profile-card premium-card'}>
          <div className="premium-icon" aria-label={isPremium ? 'Premium active' : 'Premium inactive'}><Crown size={24} /></div>
          <div><span className="profile-card-label">Membership</span><h2>{isPremium ? 'Premium' : 'Normal'}</h2><p>{isPremium ? (entitlement?.plan_label || 'Active premium access') : 'Premium access is not active'}</p></div>
          <span className={isPremium ? 'premium-state premium-state--active' : 'premium-state'}>{isPremium ? 'Active' : 'Normal'}</span>
        </article>
      </div>
      {isPremium ? <article className="profile-card profile-term"><div className="profile-section-icon"><Clock3 size={19} /></div><div><span className="profile-card-label">Premium remaining</span><h2>{term}</h2><p>{entitlement?.valid_until ? `Valid until ${formatDate(entitlement.valid_until)}` : 'Premium access is active.'}</p></div></article> : <article className="profile-card wallet-card"><div className="profile-section-icon"><WalletCards size={19} /></div><div className="wallet-card__copy"><span className="profile-card-label">Point Wallet</span><h2>{pointBalance.toLocaleString()} Points</h2><p>1 Ks = 1 Point · Movie unlock: 15 Points · Episode unlock: 5 Points.</p><div className="wallet-redeem"><label htmlFor="prepaid-code">Prepaid code</label><div><input id="prepaid-code" value={prepaidCode} onChange={(event) => setPrepaidCode(event.target.value.toUpperCase())} placeholder="YG-XXXX-XXXX-XXXX" autoCapitalize="characters" /><button className="button button--primary" type="button" onClick={redeemCode} disabled={!prepaidCode.trim() || redeeming}><KeyRound size={15} />{redeeming ? 'Redeeming…' : 'Redeem'}</button></div>{walletMessage && <small className="wallet-message wallet-message--success"><CheckCircle2 size={14} />{walletMessage}</small>}{walletError && <small className="wallet-message wallet-message--error"><AlertCircle size={14} />{walletError}</small>}</div></div></article>}
      <section className="profile-history" id="billing"><div className="profile-section-heading"><div><span className="eyebrow">Account activity</span><h2>Billing</h2></div><ReceiptText size={22} /></div>{orders?.data.length ? <div className="purchase-list">{orders.data.map((order) => <article className="purchase-row" key={order.id}><div className="purchase-icon"><ReceiptText size={17} /></div><div className="purchase-main"><strong>{order.purpose || order.plan_key || 'Payment order'}</strong><span>{order.reference || `Order ${order.id}`} · {formatDate(order.created_at)}</span></div><div className="purchase-meta"><strong>{Number.isFinite(Number(order.amount_ks)) ? `${Number(order.amount_ks).toLocaleString()} Ks` : 'Amount unavailable'}</strong><span className={`purchase-status purchase-status--${order.status || 'unknown'}`}><CheckCircle2 size={12} />{orderStatus(order.status)}</span></div></article>)}</div> : <div className="profile-empty">{ordersError || 'No billing history yet.'}</div>}</section>
      <button className="profile-logout profile-logout--bottom" type="button" onClick={() => { signOut(); navigate('/auth', { replace: true }); }}><LogOut size={16} /> Log out</button>
    </>}
  </section>;
}
