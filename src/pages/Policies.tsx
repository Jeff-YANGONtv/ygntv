import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Clock3, FileCheck2, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import '../styles/policies.css';

type PolicyKind = 'privacy' | 'terms';

type PolicySection = {
  number: string;
  title: string;
  body: string;
  points?: string[];
  icon: typeof ShieldCheck;
};

const privacySections: PolicySection[] = [
  { number: '01', title: 'Account information', body: 'အကောင့်ဖန်တီးခြင်းနှင့် အသုံးပြုခြင်းအတွက် အမည်၊ email၊ password hash၊ Telegram ID၊ Google/social login identifier နှင့် passkey public-key information များကို လိုအပ်သလို သိမ်းဆည်းနိုင်ပါသည်။', icon: LockKeyhole },
  { number: '02', title: 'Your viewing trail', body: 'Account ဝင်ထားပြီး ကြည့်ရှုထားသည့် movie သို့မဟုတ် episode၊ viewing progress၊ နောက်ဆုံးကြည့်ရှုချိန်၊ ပြီးဆုံး/မပြီးဆုံးအခြေအနေ၊ saved titles နှင့် blog interaction များကို သက်ဆိုင်ရာ feature များအတွက် ချိတ်ဆက်သိမ်းဆည်းနိုင်ပါသည်။', icon: Clock3 },
  { number: '03', title: 'Premium & receipt review', body: 'Premium access တောင်းဆိုသည့်အခါ plan၊ payment order၊ receipt ပုံ၊ receipt reference/TxID၊ ငွေလွှဲသူအမည်၊ review status နှင့် လိုအပ်သော Telegram receipt identifier များကို payment စစ်ဆေးရန် အသုံးပြုနိုင်ပါသည်။', icon: FileCheck2 },
  { number: '04', title: 'Support conversations', body: 'Support chat၊ email၊ Telegram သို့မဟုတ် Messenger မှတစ်ဆင့် ပေးပို့သော visitor name၊ email၊ message၊ page URL နှင့် attachment အချက်အလက်များကို ပြဿနာဖြေရှင်းရန် အသုံးပြုနိုင်ပါသည်။', icon: Mail },
  { number: '05', title: 'How we use data', body: 'Account နှင့် login ကို စီမံရန်၊ content နှင့် viewing features ပေးရန်၊ Premium payment စစ်ဆေးရန်၊ support ဖြေကြားရန်နှင့် fraud/security ကာကွယ်ရန် အချက်အလက်များကို အသုံးပြုပါသည်။', icon: ShieldCheck },
  { number: '06', title: 'Your control', body: 'သင့် data ကို သိရှိရန်၊ မှားယွင်းမှု ပြင်ရန် သို့မဟုတ် ဖျက်ရန် တောင်းဆိုလိုပါက Privacy Request ခေါင်းစဉ်ဖြင့် office@ygntv.org သို့ ဆက်သွယ်နိုင်ပါသည်။ Account ပိုင်ရှင်ဖြစ်ကြောင်း အတည်ပြုရန် လိုအပ်နိုင်ပါသည်။', icon: Sparkles },
];

const termsSections: PolicySection[] = [
  { number: '01', title: 'Use Yangon TV with care', body: 'Yangon TV သည် movie၊ series၊ မြန်မာစာတန်းထိုး entertainment content နှင့် editorial content များကို ရှာဖွေကြည့်ရှုနိုင်ရန် ပံ့ပိုးပေးသော platform ဖြစ်ပါသည်။ Feature အချို့အတွက် account ဝင်ထားရန် လိုအပ်နိုင်ပါသည်။', icon: Sparkles },
  { number: '02', title: 'Keep your account yours', body: 'Account information ကို မှန်ကန်စွာ ပေးရမည်ဖြစ်ပြီး account၊ password၊ passkey သို့မဟုတ် Premium access ကို အခြားသူထံ မမျှဝေရပါ။ သင့် account မှ ပြုလုပ်သည့် လုပ်ဆောင်ချက်များအတွက် သင်တာဝန်ရှိပါသည်။', icon: LockKeyhole },
  { number: '03', title: 'Respect the content', body: 'Movie၊ series၊ episode၊ poster၊ blog စာသား၊ logo နှင့် website design များကို ကိုယ်ပိုင်အသုံးပြုရန်သာ ကြည့်ရှုနိုင်ပါသည်။ ခွင့်ပြုချက်မရှိဘဲ ကူးယူခြင်း၊ ပြန်လည်ဖြန့်ချိခြင်း၊ ရောင်းချခြင်း သို့မဟုတ် အများပြည်သူသို့ ပြသခြင်း မပြုရပါ။', icon: ShieldCheck },
  { number: '04', title: 'Premium review is real', body: 'Receipt တင်ပြခြင်းသည် Premium access အလိုအလျောက်ဖွင့်ပြီးကြောင်း မဆိုလိုပါ။ Admin အဖွဲ့က payment နှင့် receipt ကို စစ်ဆေးပြီး approve ပြုလုပ်ပြီးမှ access ကို ဖွင့်ပေးမည်ဖြစ်ပါသည်။', icon: FileCheck2 },
  { number: '05', title: 'No abuse or bypass', body: 'အတုအယောင် receipt/TxID အသုံးပြုခြင်း၊ service ကို တိုက်ခိုက်ခြင်း၊ scraper/bot ဖြင့် နှောင့်ယှက်ခြင်း၊ malware ပေးပို့ခြင်း၊ spam သို့မဟုတ် တရားမဝင်အကြောင်းအရာ ဖြန့်ဝေခြင်း မပြုရပါ။', icon: Check },
  { number: '06', title: 'A living draft', body: 'ဤစည်းမျဉ်းများသည် လက်ရှိ feature များအပေါ် အခြေခံထားသော မူကြမ်းဖြစ်ပါသည်။ Roadmap Phase 2 အတွင်း တရားဝင်လိုင်စင်နှင့် ခွင့်ပြုချက်များ လျှောက်ထားပြီးနောက် လိုအပ်သလို ပြင်ဆင်မည်ဖြစ်ပါသည်။', icon: Sparkles },
];

function PolicyIllustration({ kind }: { kind: PolicyKind }) {
  return <div className={`policy-illustration policy-illustration--${kind}`} aria-hidden="true"><div className="policy-illustration__orbit policy-illustration__orbit--one" /><div className="policy-illustration__orbit policy-illustration__orbit--two" /><div className="policy-illustration__card"><div className="policy-illustration__line policy-illustration__line--long" /><div className="policy-illustration__line" /><div className="policy-illustration__line policy-illustration__line--short" /><div className="policy-illustration__seal">{kind === 'privacy' ? <LockKeyhole size={21} /> : <FileCheck2 size={21} />}</div></div><span className="policy-illustration__spark policy-illustration__spark--one">✦</span><span className="policy-illustration__spark policy-illustration__spark--two">✦</span></div>;
}

function PolicyTimeline({ sections }: { sections: PolicySection[] }) {
  return <div className="policy-timeline">{sections.map(({ number, title, body, icon: Icon }, index) => <article className="policy-step" key={number} style={{ '--step-delay': `${index * 70}ms` } as React.CSSProperties}><div className="policy-step__marker"><span>{number}</span><Icon size={18} /></div><div className="policy-step__content"><span className="eyebrow">Policy point {number}</span><h2>{title}</h2><p>{body}</p></div></article>)}</div>;
}

function PolicyPage({ kind }: { kind: PolicyKind }) {
  const isPrivacy = kind === 'privacy';
  const sections = isPrivacy ? privacySections : termsSections;
  const title = isPrivacy ? <>Privacy <em>Policy</em></> : <>Terms of <em>Service</em></>;
  const intro = isPrivacy ? 'သင့် data ကို ဘာကြောင့်လိုအပ်ပြီး ဘယ်လိုကိုင်တွယ်သလဲဆိုတာကို ရှင်းလင်းစွာ ဖော်ပြထားပါတယ်။' : 'Yangon TV ကို လုံခြုံပြီး တာဝန်ရှိစွာ အသုံးပြုနိုင်ရန် လိုက်နာရမည့် စည်းမျဉ်းများ ဖြစ်ပါတယ်။';
  return <div className="policy-page page"><section className="policy-hero"><div className="container policy-hero__inner"><div className="policy-hero__copy"><span className="eyebrow"><i /> Yangon TV policy</span><h1>{title}</h1><p>{intro}</p><div className="policy-hero__meta"><span><Clock3 size={14} /> Effective 01 October 2026</span><span><ShieldCheck size={14} /> Draft policy</span></div><div className="policy-switcher"><Link className={isPrivacy ? 'policy-switcher__link policy-switcher__link--active' : 'policy-switcher__link'} to="/privacy-policy">Privacy</Link><Link className={!isPrivacy ? 'policy-switcher__link policy-switcher__link--active' : 'policy-switcher__link'} to="/terms-of-service">Terms</Link></div></div></div></section><section className="container policy-body"><div className="policy-body__intro"><div><span className="eyebrow">The clear version</span><h2>What this means<br /><em>for you.</em></h2></div><p>အောက်ပါအချက်များသည် Yangon TV ၏ လက်ရှိ website နှင့် backend feature များကို အခြေခံထားသည့် လိုရင်းဖော်ပြချက်များ ဖြစ်ပါတယ်။</p></div><PolicyTimeline sections={sections} /><div className="policy-phase"><div className="policy-phase__icon"><Sparkles size={22} /></div><div><span className="eyebrow">Roadmap · Phase 2</span><h2>Built to become official.</h2><p>ဤစာမျက်နှာသည် လက်ရှိ feature များအပေါ် အခြေခံထားသည့် မူကြမ်းဖြစ်ပါတယ်။ Roadmap ၏ Phase 2 ကာလအတွင်း တရားဝင်လုပ်ငန်းလိုင်စင်နှင့် သက်ဆိုင်ရာခွင့်ပြုချက်များ လျှောက်ထားသွားမည်ဖြစ်ပြီး ထိုလုပ်ငန်းစဉ်နှင့်အတူ မူဝါဒပိုင်းဆိုင်ရာ ပြောင်းလဲမှုများ ရှိနိုင်ပါတယ်။ အတည်ပြုပြီးသော version ကို ဤစာမျက်နှာတွင် ပြန်လည်ဖော်ပြပါမယ်။</p></div><ArrowRight size={20} className="policy-phase__arrow" /></div><div className="policy-contact"><div><span className="eyebrow">Questions?</span><h2>Talk to the Yangon TV team.</h2></div><a className="button button--primary" href="mailto:office@ygntv.org">Contact us <ArrowRight size={15} /></a></div></section></div>;
}

export function PrivacyPolicyPage() { return <PolicyPage kind="privacy" />; }
export function TermsOfServicePage() { return <PolicyPage kind="terms" />; }
