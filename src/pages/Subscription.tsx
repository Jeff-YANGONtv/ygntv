import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Crown, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPremiumPlans } from '../lib/api';
import type { PremiumPlan } from '../lib/types';
import '../styles/subscription-tabs.css';

const price = (amount: number) => `${amount.toLocaleString()} Ks`;

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.access_months - b.access_months), [plans]);

  useEffect(() => {
    let active = true;
    getPremiumPlans()
      .then((nextPlans) => { if (active) setPlans(nextPlans); })
      .catch(() => { if (active) setError('Membership options are temporarily unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="subscription-page container">
    <button type="button" className="subscription-page-back" onClick={() => navigate(-1)}><ArrowLeft size={16} />Back</button>
    <div className="subscription-heading"><span className="eyebrow">Yangon TV access</span><h1><em>Subscription</em></h1><p>Choose a membership plan that fits your viewing time.</p></div>
    {loading && <div className="profile-loading" role="status"><LoaderCircle className="spin" size={18} /> Loading membership plans…</div>}
    {error && <div className="profile-alert subscription-alert" role="alert">{error}</div>}
    {!loading && <MembershipTable plans={orderedPlans} />}
  </section>;
}

function MembershipTable({ plans }: { plans: PremiumPlan[] }) {
  const rows = Array.from({ length: Math.ceil(plans.length / 2) }, (_, index) => [plans[index * 2], plans[index * 2 + 1]]);
  return <section className="subscription-stage subscription-stage--table"><div className="subscription-stage__heading"><div><span className="profile-card-label">Membership plans</span><h2>Choose your lifetime</h2><p>Membership prices are updated from the Yangon TV service.</p></div><Crown /></div><div className="membership-table" role="table" aria-label="Membership plan prices"><div className="membership-table__head" role="row"><span>Membership</span><span>Price</span><span>Membership</span><span>Price</span></div>{rows.length ? rows.map(([left, right]) => <div className="membership-table__row" role="row" key={`${left?.key ?? 'empty'}-${right?.key ?? 'empty'}`}><span>{left?.label ?? '—'}</span><strong>{left ? price(left.amount_ks) : '—'}</strong><span>{right?.label ?? '—'}</span><strong>{right ? price(right.amount_ks) : '—'}</strong></div>) : <div className="membership-table__row" role="row"><span>No membership plans available</span><span>—</span><span>—</span><span>—</span></div>}</div></section>;
}
