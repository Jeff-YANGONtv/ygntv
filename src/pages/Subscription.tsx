import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, Clock3, Copy, Crown, FileImage, KeyRound, LoaderCircle, LockKeyhole, RefreshCw, ScanText, ShieldCheck, UploadCloud, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPaymentOrder, getPremiumPlans, getPublicPaymentAccounts, redeemPrepaidCode, submitOrderReceipt } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PaymentAccount, PaymentOrder, PremiumPlan } from '../lib/types';
import '../styles/card-first-subscription.css';

type Step = 'cards' | 'plans' | 'methods' | 'payment' | 'confirmed' | 'card_confirmed';

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
  return value.includes('wave') ? 'W' : value.includes('kbz') || value.includes('kpay') ? 'K' : value.includes('aya') ? 'A' : name.slice(0, 1).toUpperCase();
}

function walletLogo(name: string) {
  const value = name.toLowerCase();
  if (value.includes('wave')) return 'https://cdn.phototourl.com/member/2026-08-21-07dccc38-a56c-40f9-89ba-dd44fabaf2d0.jpg';
  if (value.includes('kbz') || value.includes('kpay')) return 'https://cdn.phototourl.com/member/2026-08-21-3c6180f1-040f-419f-8527-13bccd03cfe1.jpg';
  if (value.includes('aya')) return 'https://cdn.phototourl.com/member/2026-08-21-17d7c73a-ab95-4c85-b6cf-fcc17e6c1cec.jpg';
  return '';
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
  const [step, setStep] = useState<Step>('cards');
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [plan, setPlan] = useState<PremiumPlan | null>(null);
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [reference, setReference] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [countdown, setCountdown] = useState(5);
  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.access_months - b.access_months), [plans]);

  useEffect(() => {
    let active = true;
    Promise.all([getPremiumPlans(), getPublicPaymentAccounts()])
      .then(([nextPlans, nextAccounts]) => { if (active) { setPlans(nextPlans); setAccounts(nextAccounts.filter((item) => item.is_active !== false)); } })
      .catch((requestError) => { if (active) setError(errorMessage(requestError, 'Premium options are temporarily unavailable.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (step !== 'confirmed' && step !== 'card_confirmed') return;
    setCountdown(5);
    const redirect = window.setTimeout(() => navigate('/profile'), 5000);
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => { window.clearTimeout(redirect); window.clearInterval(timer); };
  }, [navigate, step]);

  const requireAuth = () => {
    if (token) return true;
    openAuth('login', '/subscription');
    return false;
  };
  const redeemCard = async () => {
    if (!requireAuth() || !cardCode.trim() || busy) return;
    setBusy(true); setError(''); setCardMessage('');
    try {
      const result = await redeemPrepaidCode(cardCode.trim());
      setCardCode('');
      if (result.card_type === 'premium_time') {
        setCardMessage(`${result.premium_months ?? 0} month Premium Time Card activated. Your membership is ready.`);
        setStep('card_confirmed');
      } else {
        setCardMessage(`${(result.credited_points ?? 0).toLocaleString()} Points were added. You can use them from your Profile wallet.`);
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'This card could not be redeemed. Please check the code and try again.'));
    } finally { setBusy(false); }
  };
  const choosePlan = (selected: PremiumPlan) => {
    if (!requireAuth()) return;
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

  return <section className="subscription-page container">
    <div className="subscription-heading"><span className="eyebrow">Yangon TV membership</span><h1><em>Premium</em> Subscription</h1><p>{step === 'cards' ? 'Redeem a Premium Time Card for instant access. Bank transfer remains available only when you do not have a card.' : 'Bank transfer is a backup option. Premium activates after the Yangon TV team verifies your receipt.'}</p></div>
    {loading && <div className="profile-loading" role="status"><LoaderCircle className="spin" size={18} /> Loading current subscription options…</div>}
    {error && <div className="profile-alert subscription-alert" role="alert">{error}</div>}
    {!loading && step === 'cards' && <CardStep cardCode={cardCode} message={cardMessage} busy={busy} signedIn={Boolean(token)} onCode={setCardCode} onRedeem={redeemCard} onFallback={() => { setError(''); setStep('plans'); }} />}
    {!loading && step === 'plans' && <PlanStep plans={orderedPlans} signedIn={Boolean(token)} onChoose={choosePlan} onBack={() => setStep('cards')} />}
    {!loading && step === 'methods' && plan && <MethodStep plan={plan} accounts={accounts} busy={busy} onChoose={chooseAccount} onBack={() => setStep('plans')} />}
    {!loading && step === 'payment' && plan && account && order && <PaymentStep plan={plan} account={account} order={order} preview={preview} reference={reference} scanning={scanning} busy={busy} copied={copied} onCopy={copy} onUpload={upload} onReference={setReference} onSubmit={submit} />}
    {!loading && step === 'confirmed' && <Confirmation eyebrow="Receipt submitted" title="Thanks — your request is under review." copy="The Yangon TV admin team will verify your backup payment. Premium activates automatically after approval." seconds={countdown} onProfile={() => navigate('/profile')} />}
    {!loading && step === 'card_confirmed' && <Confirmation eyebrow="Premium Time Card redeemed" title="Your Premium access is active." copy={cardMessage} seconds={countdown} onProfile={() => navigate('/profile')} />}
  </section>;
}

function CardStep({ cardCode, message, busy, signedIn, onCode, onRedeem, onFallback }: { cardCode: string; message: string; busy: boolean; signedIn: boolean; onCode: (value: string) => void; onRedeem: () => void; onFallback: () => void }) {
  return <div className="subscription-stage subscription-stage--cards"><div className="subscription-stage__heading"><div><span className="profile-card-label">Primary method</span><h2>Redeem a Premium Time Card</h2><p>One secure code activates or extends your Premium membership immediately.</p></div><KeyRound /></div><div className="subscription-card-redeem"><label htmlFor="premium-card-code">Premium Time Card code</label><div><input id="premium-card-code" value={cardCode} onChange={(event) => onCode(event.target.value.toUpperCase())} placeholder="YG-XXXX-XXXX-XXXX" autoCapitalize="characters" /><button className="button button--primary" type="button" onClick={onRedeem} disabled={!cardCode.trim() || busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <KeyRound size={16} />}{busy ? 'Redeeming…' : signedIn ? 'Activate Premium' : 'Sign in to redeem'}</button></div>{message && <p className="subscription-card-success"><CheckCircle2 size={15} />{message}</p>}</div><div className="subscription-card-benefits"><span><CheckCircle2 size={15} />3, 6, 9 or 12 month cards</span><span><CheckCircle2 size={15} />One-time secure code</span><span><CheckCircle2 size={15} />Extends active Premium time</span></div><button className="subscription-back" type="button" onClick={onFallback}>I do not have a Premium Time Card — use bank transfer</button></div>;
}

function PlanStep({ plans, signedIn, onChoose, onBack }: { plans: PremiumPlan[]; signedIn: boolean; onChoose: (plan: PremiumPlan) => void; onBack: () => void }) {
  return <div className="subscription-stage"><div className="subscription-stage__heading"><div><span className="profile-card-label">Backup method</span><h2>Bank transfer Premium</h2><p>Select a plan only if a Premium Time Card is unavailable.</p></div><WalletCards /></div>{plans.length === 0 ? <div className="subscription-empty"><WalletCards size={24} /><strong>No Premium plans are available right now.</strong><span>Please check back shortly.</span></div> : <div className="subscription-grid--plans">{plans.map((plan) => <button className="subscription-card" type="button" key={plan.key} onClick={() => onChoose(plan)}><span className="subscription-card__glow" /><span className="profile-card-label">{plan.access_months} month access</span><strong>{plan.label}</strong><b className="subscription-price">{price(plan.amount_ks)}</b><span className="subscription-card__action">{signedIn ? 'Select backup payment' : 'Sign in to select'} <Crown size={14} /></span></button>)}</div>}{!signedIn && <p className="subscription-signin-note"><LockKeyhole size={14} /> Sign in is required before a payment order can be created.</p>}<button className="subscription-back" type="button" onClick={onBack}>Back to Premium Time Card</button></div>;
}

function MethodStep({ plan, accounts, busy, onChoose, onBack }: { plan: PremiumPlan; accounts: PaymentAccount[]; busy: boolean; onChoose: (account: PaymentAccount) => void; onBack: () => void }) {
  return <div className="subscription-stage"><div className="subscription-stage__heading"><div><span className="profile-card-label">Backup method</span><h2>Choose a payment method</h2><p>{plan.label} · <b>{price(plan.amount_ks)}</b></p></div><WalletCards /></div>{accounts.length === 0 ? <div className="subscription-empty subscription-empty--method"><WalletCards size={25} /><strong>Payment methods coming soon</strong><span>Once a live account is added in the admin panel, it will appear here automatically.</span><button className="button button--outline" type="button" onClick={onBack}>Back to plans</button></div> : <><div className="payment-method-grid">{accounts.map((account) => <button key={account.id} type="button" className={`payment-method ${walletTone(account.name)}`} onClick={() => onChoose(account)} disabled={busy}><PaymentLogo name={account.name} /><b>{account.name}</b><small>{account.description || 'Tap to continue'}</small>{busy ? <LoaderCircle className="spin" size={16} /> : <span className="payment-method__arrow">→</span>}</button>)}</div><button className="subscription-back" type="button" onClick={onBack}>Choose another plan</button></>}</div>;
}

function PaymentStep({ plan, account, order, preview, reference, scanning, busy, copied, onCopy, onUpload, onReference, onSubmit }: { plan: PremiumPlan; account: PaymentAccount; order: PaymentOrder; preview: string; reference: string; scanning: boolean; busy: boolean; copied: string; onCopy: (value: string | null | undefined, label: string) => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onReference: (value: string) => void; onSubmit: () => void }) {
  return <div className="payment-layout"><div className="payment-panel payment-panel--details"><div className="subscription-stage__heading"><div><span className="profile-card-label">Backup payment</span><h2>Transfer details</h2><p>Send the exact amount using the selected account.</p></div><ShieldCheck /></div><div className="payment-summary"><span>{plan.label}</span><b>{price(plan.amount_ks)}</b></div><div className="payment-account-card"><PaymentLogo name={account.name} /><div><span className="profile-card-label">Payment Method</span><strong>{account.name}</strong></div></div><div className="copy-list"><CopyRow label="Account Name" value={account.account_name || 'Not supplied'} copyValue={account.account_name} copied={copied === 'Name'} onCopy={() => onCopy(account.account_name, 'Name')} /><CopyRow label="Account Number" value={account.account_number || 'Not supplied'} copyValue={account.account_number} copied={copied === 'Account'} onCopy={() => onCopy(account.account_number, 'Account')} /><CopyRow label="Amount to transfer" value={price(plan.amount_ks)} copyValue={String(plan.amount_ks)} copied={copied === 'Amount'} onCopy={() => onCopy(String(plan.amount_ks), 'Amount')} amount /><CopyRow label="Order reference" value={order.reference || 'Assigned by Yangon TV'} copyValue={order.reference} copied={copied === 'Order'} onCopy={() => onCopy(order.reference, 'Order')} reference /></div><p className="payment-note"><ShieldCheck size={15} /> Premium activates only after an admin verifies this backup payment receipt.</p></div><div className="payment-panel payment-panel--upload"><div className="subscription-stage__heading"><div><span className="profile-card-label">Proof of transfer</span><h2>Upload your slip</h2><p>JPG, PNG or WebP · maximum 5 MB</p></div><FileImage /></div><label className={preview ? 'receipt-upload receipt-upload--ready' : 'receipt-upload'}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />{preview ? <><img src={preview} alt="Selected transfer receipt preview" /><span><RefreshCw size={15} /> Replace receipt</span></> : <><UploadCloud size={29} /><strong>Select receipt image</strong><span>Tap to browse your device</span></>}</label><label className="txid-field"><span><ScanText size={15} /> TxID / Receipt reference</span><input value={reference} onChange={(event) => onReference(event.target.value)} placeholder={scanning ? 'Scanning receipt…' : 'Will be suggested after upload'} /><small>{scanning ? 'Reading the receipt image locally…' : 'Check the suggested value against your transfer slip before submitting.'}</small></label><button className="button button--primary receipt-submit" type="button" onClick={onSubmit} disabled={!preview || busy || scanning}>{busy ? <><LoaderCircle className="spin" size={16} /> Submitting…</> : <><CheckCircle2 size={16} /> Done — submit for review</>}</button></div></div>;
}

function PaymentLogo({ name }: { name: string }) {
  const source = walletLogo(name);
  return <span className={`payment-method__mark ${walletTone(name)}${source ? ' payment-method__mark--image' : ''}`}>{source ? <img src={source} alt={`${name} logo`} /> : walletMark(name)}</span>;
}

function CopyRow({ label, value, copyValue, copied, onCopy, amount, reference }: { label: string; value: string; copyValue?: string | null; copied: boolean; onCopy: () => void; amount?: boolean; reference?: boolean }) {
  return <div className={`copy-row${reference ? ' copy-row--reference' : ''}`}><span><small>{label}</small><b>{value}</b></span><button type="button" aria-label={`Copy ${label}`} onClick={onCopy} disabled={!copyValue}>{copied ? <CheckCircle2 size={17} /> : amount ? <Clipboard size={17} /> : <Copy size={17} />}</button></div>;
}

function Confirmation({ eyebrow, title, copy, seconds, onProfile }: { eyebrow: string; title: string; copy: string; seconds: number; onProfile: () => void }) {
  return <div className="subscription-confirmation"><div className="subscription-confirmation__icon"><CheckCircle2 size={32} /></div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{copy}</p><div className="countdown"><Clock3 size={17} /><b>{seconds}</b><span>Opening your Profile in {seconds} second{seconds === 1 ? '' : 's'}…</span></div><button className="button button--outline" type="button" onClick={onProfile}>Open Profile now</button></div>;
}
