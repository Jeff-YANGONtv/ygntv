import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, Clock3, Copy, Crown, FileImage, Gift, LoaderCircle, LockKeyhole, MonitorPlay, RefreshCw, ScanText, ShieldCheck, Sparkles, UploadCloud, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPaymentOrder, getPremiumPlans, getPublicPaymentAccounts, redeemMembershipCode, submitOrderReceipt } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PaymentAccount, PaymentOrder, PremiumPlan } from '../lib/types';
import '../styles/subscription-tabs.css';

type Step = 'plans' | 'methods' | 'payment' | 'confirmed';

const price = (amount: number) => `${amount.toLocaleString()} Ks`;

function errorMessage(error: unknown, fallback: string): string {
  const data = error && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
    : undefined;
  return (data?.errors ? Object.values(data.errors).flat()[0] : '') || data?.message || fallback;
}

function walletTone(name: string) {
  const value = name.toLowerCase();
  return value.includes('wave') ? 'payment-method--wave' : value.includes('kbz') || value.includes('kpay') ? 'payment-method--kbz' : value.includes('aya') ? 'payment-method--aya' : 'payment-method--default';
}

function walletMark(name: string) {
  const value = name.toLowerCase();
  if (value.includes('wave')) return { label: 'WavePay', src: 'https://www.image2url.com/r2/default/images/1789465872900-c80821b0-f628-4186-a534-6cb94824bd54.png' };
  if (value.includes('kbz') || value.includes('kpay')) return { label: 'KPAY', src: 'https://www.image2url.com/r2/default/gifs/1788881307683-593fa67b-4cda-4d61-b696-ccfcbdb3ff5e.gif' };
  if (value.includes('aya')) return { label: 'AYA Pay', src: 'https://www.image2url.com/r2/default/gifs/1788881377855-e9283121-e9b8-4b36-9cae-ac61ac490d57.gif' };
  return { label: name.slice(0, 1).toUpperCase(), src: '' };
}

function PaymentLogo({ name }: { name: string }) {
  const mark = walletMark(name);
  return mark.src ? <span className="payment-method__mark payment-method__mark--image"><img src={mark.src} alt={`${mark.label} logo`} /></span> : <span className="payment-method__mark">{mark.label}</span>;
}

function receiptCandidate(text: string) {
  const value = text.replace(/\s+/g, ' ').toUpperCase();
  const match = value.match(/(?:TX\s*(?:ID|NO)?|TRANSACTION\s*(?:ID|NO)?|REFERENCE\s*(?:ID|NO)?|REF\s*(?:ID|NO)?)[\s:#-]*([A-Z0-9-]{6,32})/i);
  if (match?.[1]) return match[1];
  return (value.match(/\b[A-Z0-9-]{9,24}\b/g) ?? []).find((entry) => /[A-Z]/.test(entry) && !/^\d{8,}$/.test(entry)) ?? '';
}

async function readReceipt(file: File) {
  const { recognize } = await import('tesseract.js');
  return receiptCandidate((await recognize(file, 'eng')).data.text);
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { token, openAuth } = useAuth();
  const [step, setStep] = useState<Step>('plans');
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [plan, setPlan] = useState<PremiumPlan | null>(null);
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [promoCode, setPromoCode] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const [subscriptionTab, setSubscriptionTab] = useState<'plans' | 'promo'>('plans');
  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.access_months - b.access_months), [plans]);

  useEffect(() => {
    let active = true;
    Promise.all([getPremiumPlans(), getPublicPaymentAccounts()])
      .then(([nextPlans, nextAccounts]) => { if (active) { setPlans(nextPlans); setAccounts(nextAccounts.filter((item) => item.is_active !== false)); } })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'Premium purchase options are temporarily unavailable.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (step !== 'confirmed') return;
    setCountdown(5);
    const redirect = window.setTimeout(() => navigate('/'), 5000);
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => { window.clearTimeout(redirect); window.clearInterval(timer); };
  }, [navigate, step]);

  const choosePlan = (selected: PremiumPlan) => {
    if (!token) { openAuth('login', '/subscription'); return; }
    setPlan(selected); setError(''); setStep('methods');
  };
  const chooseAccount = async (selected: PaymentAccount) => {
    if (!plan || busy) return;
    setBusy(true); setError('');
    try { setOrder(await createPaymentOrder(selected.id, plan.key)); setAccount(selected); setStep('payment'); }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to create a payment order. Please choose the account again.')); }
    finally { setBusy(false); }
  };
  const copy = async (value: string | null | undefined, label: string) => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1600); }
    catch { setError('Your browser could not copy this value. Please select it manually.'); }
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Receipt images must be 5 MB or smaller.'); event.target.value = ''; return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Upload a JPG, PNG, or WebP receipt image.'); event.target.value = ''; return; }
    if (preview) URL.revokeObjectURL(preview);
    setReceipt(file); setPreview(URL.createObjectURL(file)); setReference(receiptCandidate(file.name)); setError(''); setScanning(true);
    try { const suggestion = await readReceipt(file); if (suggestion) setReference(suggestion); }
    catch { /* A filename-based candidate remains editable if OCR is unavailable. */ }
    finally { setScanning(false); }
  };
  const submit = async () => {
    if (!order || !receipt || busy) return;
    setBusy(true); setError('');
    try { await submitOrderReceipt(order.id, receipt, reference); setStep('confirmed'); }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to submit this receipt. Please try again.')); }
    finally { setBusy(false); }
  };

  const redeemPromo = async () => {
    if (!token) { openAuth('login', '/subscription'); return; }
    if (!promoCode.trim() || promoBusy) return;
    setPromoBusy(true); setError(''); setPromoSuccess('');
    try {
      const result = await redeemMembershipCode(promoCode);
      setPromoCode('');
      const validUntil = result.valid_until ? new Date(result.valid_until).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      setPromoSuccess(`Promo code activated${validUntil ? ` · Premium valid until ${validUntil}` : ''}.`);
    } catch (requestError) {
      setError(errorMessage(requestError, 'This promo code is invalid or has already been redeemed.'));
    } finally { setPromoBusy(false); }
  };

  return <section className="subscription-page container">
    <div className="subscription-heading"><span className="eyebrow">Yangon TV membership</span><h1><em>Premium</em> Subscription</h1><p>{step === 'plans' ? 'Choose a plan, select a payment method, then submit your transfer receipt for review.' : 'Premium activates automatically after the Yangon TV team verifies your submitted receipt.'}</p></div>
    <div className="purchase-progress" aria-label="Subscription purchase progress"><span className={step === 'plans' ? 'purchase-progress__item purchase-progress__item--active' : 'purchase-progress__item purchase-progress__item--done'}><b>1</b>Plan</span><i /><span className={step === 'methods' ? 'purchase-progress__item purchase-progress__item--active' : step === 'payment' || step === 'confirmed' ? 'purchase-progress__item purchase-progress__item--done' : 'purchase-progress__item'}><b>2</b>Payment</span><i /><span className={step === 'payment' ? 'purchase-progress__item purchase-progress__item--active' : step === 'confirmed' ? 'purchase-progress__item purchase-progress__item--done' : 'purchase-progress__item'}><b>3</b>Receipt</span></div>
    {loading && <div className="profile-loading" role="status"><LoaderCircle className="spin" size={18} /> Loading current subscription options…</div>}
    {error && <div className="profile-alert subscription-alert" role="alert">{error}</div>}
    {!loading && step === 'plans' && <><div className="subscription-tabs" role="tablist" aria-label="Subscription options"><button type="button" role="tab" aria-selected={subscriptionTab === 'plans'} className={subscriptionTab === 'plans' ? 'subscription-tab subscription-tab--active' : 'subscription-tab'} onClick={() => setSubscriptionTab('plans')}><Crown size={15} /> Membership plans</button><button type="button" role="tab" aria-selected={subscriptionTab === 'promo'} className={subscriptionTab === 'promo' ? 'subscription-tab subscription-tab--active' : 'subscription-tab'} onClick={() => setSubscriptionTab('promo')}><Gift size={15} /> Promo code redeem</button></div>{subscriptionTab === 'plans' ? <PlanStep plans={orderedPlans} signedIn={Boolean(token)} onChoose={choosePlan} /> : <section className="subscription-card-redeem" aria-labelledby="promo-code-title"><div className="subscription-stage__heading"><div><span className="profile-card-label">Have a promo code?</span><h2 id="promo-code-title">Redeem your membership code</h2><p>Enter a code from Yangon TV to activate Premium access instantly.</p></div><Gift size={22} /></div><div className="subscription-card-redeem__form"><input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === 'Enter') redeemPromo(); }} placeholder="Enter promo code" aria-label="Promo code" autoComplete="off" /><button className="button button--primary" type="button" onClick={redeemPromo} disabled={promoBusy || !promoCode.trim()}>{promoBusy ? <><LoaderCircle className="spin" size={16} /> Redeeming…</> : 'Redeem code'}</button></div>{!token && <small className="subscription-redeem-note">Sign in is required to redeem a code.</small>}{promoSuccess && <p className="subscription-card-success" role="status"><CheckCircle2 size={16} /> {promoSuccess}</p>}</section>}</>}
    {!loading && step === 'methods' && plan && <MethodStep plan={plan} accounts={accounts} busy={busy} onChoose={chooseAccount} onBack={() => setStep('plans')} />}
    {!loading && step === 'payment' && plan && account && order && <PaymentStep plan={plan} account={account} order={order} preview={preview} reference={reference} scanning={scanning} busy={busy} copied={copied} onCopy={copy} onUpload={upload} onReference={setReference} onSubmit={submit} />}
    {!loading && step === 'confirmed' && <Confirmation seconds={countdown} onHome={() => navigate('/')} />}
  </section>;
}

function PlanStep({ plans, signedIn, onChoose }: { plans: PremiumPlan[]; signedIn: boolean; onChoose: (plan: PremiumPlan) => void }) {
  return <div className="subscription-stage subscription-stage--plans"><div className="subscription-stage__heading"><div><span className="profile-card-label">Step 1 of 3 · Yangon TV membership</span><h2>Choose your access</h2><p>Unlock new releases, Myanmar subtitles, and a smoother way to watch.</p></div><Crown /></div>{plans.length === 0 ? <div className="subscription-empty"><WalletCards size={24} /><strong>No Premium plans are available right now.</strong><span>Please check back shortly.</span></div> : <div className="membership-plans" role="list" aria-label="Membership plans">{plans.map((plan, index) => <button className={`membership-plan${index === plans.length - 1 ? ' membership-plan--featured' : ''}`} type="button" key={plan.key} onClick={() => onChoose(plan)} role="listitem"><span className="membership-plan__glow" /><span className="membership-plan__top"><span className="membership-plan__icon"><MonitorPlay size={19} /></span>{index === plans.length - 1 && <span className="membership-plan__badge"><Sparkles size={12} /> Best value</span>}</span><span className="membership-plan__eyebrow">YGNTV MEMBERSHIP</span><strong>{plan.label}</strong><b className="membership-plan__price">{price(plan.amount_ks)}</b><span className="membership-plan__term">{plan.access_months} month{plan.access_months === 1 ? '' : 's'} access</span><span className="membership-plan__footer"><span>{signedIn ? 'Select plan' : 'Sign in to select'}</span><Crown size={15} /></span></button>)}</div>}{!signedIn && <p className="subscription-signin-note"><LockKeyhole size={14} /> Sign in is required before a payment order can be created.</p>}</div>;
}

function MethodStep({ plan, accounts, busy, onChoose, onBack }: { plan: PremiumPlan; accounts: PaymentAccount[]; busy: boolean; onChoose: (account: PaymentAccount) => void; onBack: () => void }) {
  return <div className="subscription-stage"><div className="subscription-stage__heading"><div><span className="profile-card-label">Step 2 of 3</span><h2>Choose a payment method</h2><p>{plan.label} · <b>{price(plan.amount_ks)}</b></p></div><WalletCards /></div>{accounts.length === 0 ? <div className="subscription-empty subscription-empty--method"><WalletCards size={25} /><strong>Payment methods coming soon</strong><span>Once a live account is added in the admin panel, it will appear here automatically.</span><button className="button button--outline" type="button" onClick={onBack}>Back to plans</button></div> : <><div className="payment-method-grid">{accounts.map((account) => <button key={account.id} type="button" className={`payment-method ${walletTone(account.name)}`} onClick={() => onChoose(account)} disabled={busy}><PaymentLogo name={account.name} /><b>{account.name}</b><small>{account.account_name || 'Tap to continue'}</small>{busy ? <LoaderCircle className="spin" size={16} /> : <span className="payment-method__arrow">→</span>}</button>)}</div><button className="subscription-back" type="button" onClick={onBack}>Choose another plan</button></>}</div>;
}

function PaymentStep({ plan, account, order, preview, reference, scanning, busy, copied, onCopy, onUpload, onReference, onSubmit }: { plan: PremiumPlan; account: PaymentAccount; order: PaymentOrder; preview: string; reference: string; scanning: boolean; busy: boolean; copied: string; onCopy: (value: string | null | undefined, label: string) => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onReference: (value: string) => void; onSubmit: () => void }) {
  return <div className="payment-layout"><div className="payment-panel payment-panel--details"><div className="subscription-stage__heading"><div><span className="profile-card-label">Step 3 of 3</span><h2>Transfer details</h2><p>Send the exact amount using the selected account.</p></div><ShieldCheck /></div><div className="payment-account-card"><PaymentLogo name={account.name} /><div><span className="profile-card-label">Payment method</span><strong>{account.name}</strong></div></div><div className="copy-list"><CopyRow label="Account name" value={account.account_name || 'Not supplied'} copyValue={account.account_name} copied={copied === 'Account name'} onCopy={() => onCopy(account.account_name, 'Account name')} /><CopyRow label="Number" value={account.account_number || 'Not supplied'} copyValue={account.account_number} copied={copied === 'Number'} onCopy={() => onCopy(account.account_number, 'Number')} /></div><p className="payment-note"><ShieldCheck size={15} /> Premium access activates only after an admin verifies this receipt.</p></div><div className="payment-panel payment-panel--upload"><div className="subscription-stage__heading"><div><span className="profile-card-label">Proof of transfer</span><h2>Upload your slip</h2><p>JPG, PNG or WebP · maximum 5 MB</p></div><FileImage /></div><label className={preview ? 'receipt-upload receipt-upload--ready' : 'receipt-upload'}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />{preview ? <><img src={preview} alt="Selected transfer receipt preview" /><span><RefreshCw size={15} /> Replace receipt</span></> : <><UploadCloud size={29} /><strong>Select receipt image</strong><span>Tap to browse your device</span></>}</label><label className="txid-field"><span><ScanText size={15} /> TxID / Receipt reference</span><input value={reference} onChange={(event) => onReference(event.target.value)} placeholder={scanning ? 'Scanning receipt…' : 'Will be suggested after upload'} /><small>{scanning ? 'Reading the receipt image locally…' : 'Check the suggested value against your transfer slip before submitting.'}</small></label><button className="button button--primary receipt-submit" type="button" onClick={onSubmit} disabled={!preview || busy || scanning}>{busy ? <><LoaderCircle className="spin" size={16} /> Submitting…</> : <><CheckCircle2 size={16} /> Done — submit for review</>}</button></div></div>;
}

function CopyRow({ label, value, copyValue, copied, onCopy, amount, reference }: { label: string; value: string; copyValue?: string | null; copied: boolean; onCopy: () => void; amount?: boolean; reference?: boolean }) {
  return <div className={`copy-row${reference ? ' copy-row--reference' : ''}`}><span><small>{label}</small><b>{value}</b></span><button type="button" aria-label={`Copy ${label}`} onClick={onCopy} disabled={!copyValue}>{copied ? <CheckCircle2 size={17} /> : amount ? <Clipboard size={17} /> : <Copy size={17} />}</button></div>;
}

function Confirmation({ seconds, onHome }: { seconds: number; onHome: () => void }) {
  return <div className="subscription-confirmation"><div className="subscription-confirmation__icon"><CheckCircle2 size={32} /></div><span className="eyebrow">Receipt submitted</span><h2>Thanks — your request is under review.</h2><p>The Yangon TV admin team will verify your payment. Premium activates automatically after approval.</p><div className="countdown"><Clock3 size={17} /><b>{seconds}</b><span>Returning home in {seconds} second{seconds === 1 ? '' : 's'}…</span></div><button className="button button--outline" type="button" onClick={onHome}>Return home now</button></div>;
}
