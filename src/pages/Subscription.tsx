import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Crown, KeyRound, LoaderCircle, WalletCards } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPremiumPlans, redeemPrepaidCode } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PremiumPlan } from '../lib/types';
import '../styles/card-first-subscription.css';
import '../styles/subscription-tabs.css';

type SubscriptionTab = 'membership' | 'points';
const price = (amount: number) => `${amount.toLocaleString()} Ks`;

function errorMessage(error: unknown, fallback: string): string {
  const data = error && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
    : undefined;
  return (data?.errors ? Object.values(data.errors).flat()[0] : '') || data?.message || fallback;
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, openAuth } = useAuth();
  const [tab, setTab] = useState<SubscriptionTab>(() => new URLSearchParams(location.search).get('tab') === 'points' ? 'points' : 'membership');
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [cardCode, setCardCode] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.access_months - b.access_months), [plans]);

  useEffect(() => {
    setTab(new URLSearchParams(location.search).get('tab') === 'points' ? 'points' : 'membership');
    setCardCode('');
    setCardMessage('');
    setError('');
  }, [location.search]);

  useEffect(() => {
    let active = true;
    getPremiumPlans()
      .then((nextPlans) => { if (active) setPlans(nextPlans); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'Membership options are temporarily unavailable.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setTimeout(() => navigate('/profile'), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmation, navigate]);

  const selectTab = (next: SubscriptionTab) => {
    setTab(next);
    setConfirmation('');
    navigate(`/subscription?tab=${next}`, { replace: true });
  };
  const redeemCard = async () => {
    if (!token) { openAuth('login', `/subscription?tab=${tab}`); return; }
    if (!cardCode.trim() || busy) return;
    setBusy(true); setError(''); setCardMessage('');
    try {
      const result = await redeemPrepaidCode(cardCode.trim());
      setCardCode('');
      if (result.card_type === 'premium_time') {
        setConfirmation(`${result.premium_months ?? 0} month Membership Card activated. Your remaining membership time is available in Profile.`);
      } else {
        setCardMessage(`${(result.credited_points ?? 0).toLocaleString()} Points were added to your Point Wallet.`);
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'This card could not be redeemed. Please check the code and try again.'));
    } finally { setBusy(false); }
  };

  if (confirmation) return <section className="subscription-page container"><Confirmation copy={confirmation} onProfile={() => navigate('/profile')} /></section>;

  return <section className="subscription-page container">
    <button type="button" className="subscription-page-back" onClick={() => navigate(-1)}><ArrowLeft size={16} />Back</button>
    <div className="subscription-heading"><span className="eyebrow">Yangon TV access</span><h1><em>Subscription</em></h1><p>Redeem a secure Membership Card for time-based access or a Point Card for flexible title-by-title access.</p></div>
    <div className="subscription-tabs" role="tablist" aria-label="Subscription options"><button type="button" role="tab" aria-selected={tab === 'membership'} className={tab === 'membership' ? 'subscription-tab subscription-tab--active' : 'subscription-tab'} onClick={() => selectTab('membership')}><Crown size={16} />Membership</button><button type="button" role="tab" aria-selected={tab === 'points'} className={tab === 'points' ? 'subscription-tab subscription-tab--active' : 'subscription-tab'} onClick={() => selectTab('points')}><WalletCards size={16} />Points</button></div>
    {loading && <div className="profile-loading" role="status"><LoaderCircle className="spin" size={18} /> Loading current card options…</div>}
    {error && <div className="profile-alert subscription-alert" role="alert">{error}</div>}
    {!loading && tab === 'membership' && <><MembershipTable plans={orderedPlans} /><CardRedeem title="Redeem a Membership Card" description="Enter a secure Membership Card code to activate or extend your remaining membership time." code={cardCode} message={cardMessage} busy={busy} signedIn={Boolean(token)} action="Activate Membership" onCode={setCardCode} onRedeem={redeemCard} /></>}
    {!loading && tab === 'points' && <><PointsTable /><CardRedeem title="Redeem a Point Card" description="Enter a secure Point Card code to add points to your Point Wallet." code={cardCode} message={cardMessage} busy={busy} signedIn={Boolean(token)} action="Redeem Points" onCode={setCardCode} onRedeem={redeemCard} /></>}
  </section>;
}

function MembershipTable({ plans }: { plans: PremiumPlan[] }) {
  const rows = Array.from({ length: Math.ceil(plans.length / 2) }, (_, index) => [plans[index * 2], plans[index * 2 + 1]]);
  return <section className="subscription-stage subscription-stage--table"><div className="subscription-stage__heading"><div><span className="profile-card-label">Membership plans</span><h2>Choose your lifetime</h2><p>Membership access is activated with a secure card code.</p></div><Crown /></div><div className="membership-table" role="table" aria-label="Membership plan prices"><div className="membership-table__head" role="row"><span>Membership</span><span>Price</span><span>Membership</span><span>Price</span></div>{rows.map(([left, right]) => <div className="membership-table__row" role="row" key={`${left?.key ?? 'empty'}-${right?.key ?? 'empty'}`}><span>{left?.label ?? '—'}</span><strong>{left ? price(left.amount_ks) : '—'}</strong><span>{right?.label ?? '—'}</span><strong>{right ? price(right.amount_ks) : '—'}</strong></div>)}</div></section>;
}

function PointsTable() {
  return <section className="subscription-stage subscription-stage--table"><div className="subscription-stage__heading"><div><span className="profile-card-label">Point Wallet</span><h2>Points access</h2><p>Use a Point Card, then unlock only the content you want to watch.</p></div><WalletCards /></div><div className="points-rate-table"><div><span>1 Ks</span><strong>1 Point</strong></div><div><span>1 Movie</span><strong>50 Points</strong></div><div><span>1 Episode</span><strong>25 Points</strong></div></div></section>;
}

function CardRedeem({ title, description, code, message, busy, signedIn, action, onCode, onRedeem }: { title: string; description: string; code: string; message: string; busy: boolean; signedIn: boolean; action: string; onCode: (value: string) => void; onRedeem: () => void }) {
  return <div className="subscription-stage subscription-stage--cards"><div className="subscription-stage__heading"><div><span className="profile-card-label">Secure card redemption</span><h2>{title}</h2><p>{description}</p></div><KeyRound /></div><div className="subscription-card-redeem"><label htmlFor="subscription-card-code">Yangon TV card code</label><div><input id="subscription-card-code" value={code} onChange={(event) => onCode(event.target.value.toUpperCase())} placeholder="YG-XXXX-XXXX-XXXX" autoCapitalize="characters" /><button className="button button--primary" type="button" onClick={onRedeem} disabled={!code.trim() || busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <KeyRound size={16} />}{busy ? 'Redeeming…' : signedIn ? action : 'Sign in to redeem'}</button></div>{message && <p className="subscription-card-success"><CheckCircle2 size={15} />{message}</p>}</div></div>;
}

function Confirmation({ copy, onProfile }: { copy: string; onProfile: () => void }) {
  return <div className="subscription-confirmation"><div className="subscription-confirmation__icon"><CheckCircle2 size={32} /></div><span className="eyebrow">Membership Card redeemed</span><h2>Your Membership is active.</h2><p>{copy}</p><div className="countdown"><Clock3 size={17} /><span>Opening your Profile shortly…</span></div><button className="button button--outline" type="button" onClick={onProfile}>Open Profile now</button></div>;
}
