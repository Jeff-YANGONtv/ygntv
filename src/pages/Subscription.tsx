import { useEffect, useState } from 'react';
import { Check, Crown, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPremiumPlans } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PremiumPlan } from '../lib/types';

function planLabel(plan: PremiumPlan): string {
  return plan.label || plan.name || plan.key || 'Premium plan';
}

function planPrice(plan: PremiumPlan): string {
  const amount = Number(plan.price_ks);
  return Number.isFinite(amount) ? `${amount.toLocaleString()} Ks` : 'Price unavailable';
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { token, openAuth } = useAuth();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getPremiumPlans()
      .then((nextPlans) => { if (mounted) setPlans(nextPlans); })
      .catch(() => { if (mounted) setError('Premium plans are temporarily unavailable. Please try again.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return <section className="subscription-page container">
    <div className="subscription-heading"><span className="eyebrow">Yangon TV membership</span><h1>Premium <em>Subscription</em></h1><p>Choose the membership plan currently available from Yangon TV.</p></div>
    {loading && <div className="profile-loading" role="status"><LoaderCircle className="spin" size={18} /> Loading premium plans…</div>}
    {error && <div className="profile-alert" role="alert">{error}</div>}
    {!loading && !error && plans.length === 0 && <div className="profile-empty">No premium plans are available right now.</div>}
    {!loading && !error && plans.length > 0 && <div className="subscription-grid">{plans.map((plan, index) => <article className={index === 1 ? 'subscription-card subscription-card--featured' : 'subscription-card'} key={plan.id}>
      <div className="subscription-card-top"><div className="subscription-icon"><Crown size={20} /></div>{index === 1 && <span className="subscription-recommended">Recommended</span>}</div>
      <span className="profile-card-label">Membership plan</span><h2>{planLabel(plan)}</h2><strong className="subscription-price">{planPrice(plan)}</strong>{plan.duration_days && <p className="subscription-duration">{plan.duration_days} days access</p>}
      {Array.isArray(plan.features) && plan.features.length > 0 && <ul className="subscription-features">{plan.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul>}
      <button className="button button--primary subscription-action" type="button" onClick={() => { if (!token) openAuth('login', '/subscription'); else navigate('/profile'); }}>{token ? 'Continue' : 'Sign in to continue'} {!token && <LockKeyhole size={14} />}</button>
    </article>)}</div>}
  </section>;
}
