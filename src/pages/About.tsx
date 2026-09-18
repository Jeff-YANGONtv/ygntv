import { ArrowRight, BookOpen, Check, Mail, MessageCircle, MonitorPlay, Send, Smartphone, Tv } from 'lucide-react';
import { useState } from 'react';
import '../styles/about-contact.css';

type Phase = {
  number: string;
  label: string;
  status?: string;
  title: string;
  icon: typeof MonitorPlay;
  items: string[];
  goal: string;
  current?: boolean;
};

const phases: Phase[] = [
  {
    number: '01', label: 'CURRENT', status: 'လက်ရှိကာလ', title: 'Platform Launch & Core Content', icon: MonitorPlay, current: true,
    items: ['Yangon TV web streaming platform ကို တည်ဆောက်ခြင်း', 'မြန်မာစာတန်းထိုး ရုပ်ရှင်နှင့် ဇာတ်လမ်းတွဲများကို စုစည်းတင်ဆက်ခြင်း', 'အသက်သာဆုံးလစဉ်ကြေးဖြင့်သင့်တင့်ကောင်းမွန်သောတင်ဆက်မှုစနစ်စတင်ခြင်း'],
    goal: 'အသက်သာဆုံးဝန် ဆောင်ခဖြင့် ရိုးရှင်းစုံလင်သောတင်ဆက်မှု',
  },
  {
    number: '02', label: 'PHASE 02', title: 'Platform Upgrade & Business Operations', icon: Smartphone,
    items: ['ပလက်ဖောင်းအား နည်းပညာပိုင်းအရ အဆင့်မြှင့်တင်ခြင်းနှင့် လုပ်ငန်းလိုင်စင်လျှောက်ထားခြင်း', 'အလုပ်အဖွဲ့ယန္တရားအားပြန်လည်ဖွဲ့စည်း၍ လုပ်ငန်းလည်ပတ်ုအရှိန်နှင့်အဆင့်အတန်းပုံရိပ်အားမြှင့်တင်ခြင်း'],
    goal: 'နည်းပညာနှင့် လုပ်ငန်းလည်ပတ်မှုအဆင့်အတန်းကို မြှင့်တင်ရန်။',
  },
  {
    number: '03', label: 'PHASE 03', title: 'Mobile Apps & Custom Features', icon: Smartphone,
    items: ['Android နှင့် iOS app များ', 'Offline download', 'Subtitle နှင့် audio options များ'],
    goal: 'ဖုန်းအသုံးပြုသူများအတွက် ပိုမိုလွယ်ကူပြီး အဆင်ပြေစေရန်။',
  },
  {
    number: '04', label: 'PHASE 04', title: 'Ultra-Fast Streaming & Smart TV', icon: Tv,
    items: ['Smart TV နှင့် Android TV support', 'ပိုမိုမြန်ဆန်သော streaming', 'Personalized recommendations'],
    goal: 'အိမ်တွင်းကြည့်ရှုမှုအတွေ့အကြုံကို ပိုမိုကောင်းမွန်စေရန်။',
  },
  {
    number: '05', label: 'PHASE 05', title: 'Education & Original Content', icon: BookOpen,
    items: ['IT နှင့် Tech Talk အစီအစဉ်များ', 'Original shows နှင့် documentary များ', 'Yangon TV ကိုယ်ပိုင်ဖန်တီးမှုများ'],
    goal: 'ဖျော်ဖြေရေးအပြင် အသိပညာနှင့် မူရင်းအကြောင်းအရာများပါ ပေးစွမ်းနိုင်သော digital media platform ဖြစ်လာစေရန်။',
  },
];

function PhaseCard({ phase, open, onToggle }: { phase: Phase; open: boolean; onToggle: () => void }) {
  const Icon = phase.icon;
  return <div className={`roadmap-card-wrap ${phase.current ? 'roadmap-card-wrap--current' : ''}`}>
    <div className={`roadmap-card${open ? ' roadmap-card--open' : ''}`}>
      <button className="roadmap-card__face roadmap-card__front" type="button" onClick={onToggle} aria-label={`${phase.current ? 'Current phase. ' : ''}${phase.title}. Click to view details`} aria-expanded={open}>
        <span className="roadmap-card__number" aria-hidden="true">{phase.number}</span>
        <span className="roadmap-card__icon"><Icon size={22} aria-hidden="true" /></span>
        <span className="roadmap-card__label">{phase.label}{phase.status && <small><i aria-hidden="true" />{phase.status}</small>}{phase.current && <small className="roadmap-card__ongoing"><i aria-hidden="true" />ONGOING</small>}</span>
        <strong>{phase.title}</strong>
        <span className="roadmap-card__action">{phase.current ? 'CURRENT PHASE  •  ' : ''}CLICK TO VIEW <ArrowRight size={15} aria-hidden="true" /></span>
      </button>
      <div className="roadmap-card__face roadmap-card__back" role="button" tabIndex={open ? 0 : -1} aria-label={`${phase.title} details. Tap to return to overview`} aria-hidden={!open} onClick={onToggle} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(); } }}>
        <div className="roadmap-card__back-head"><span className="roadmap-card__label">{phase.label}</span><span className="roadmap-card__back-hint" aria-hidden="true">TAP CARD TO RETURN</span></div>
        <h3>{phase.title}</h3>
        <ul>{phase.items.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul>
        <div className="roadmap-card__goal"><b>Goal</b><p>{phase.goal}</p></div>
      </div>
    </div>
  </div>;
}

export function AboutPage() {
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const toggleCard = (number: string) => setOpenCards((state) => ({ ...state, [number]: !state[number] }));

  return <div className="page about-page">
    <section className="container about-intro-card" aria-label="What Is Yangon"><span className="eyebrow"><i aria-hidden="true" />WHAT IS YANGON ?</span><p>Yangon TV သည် နိုင်ငံတကာ ရုပ်ရှင်ကားကြီးများ၊ နာမည်ကြီး ဇာတ်လမ်းတွဲများနှင့် ရုပ်သံဖျော်ဖြေရေးအစီအစဉ်များကို မြန်မာစာတန်းထိုးဖြင့် ကြည်လင်ပြတ်သားစွာ တစ်နေရာတည်းမှာ ကြည့်ရှုနိုင်စေတဲ့ Online Streaming Platform ဖြစ်ပါတယ်။</p></section>
    <section className="container about-tagline" aria-labelledby="tagline-title"><span className="eyebrow">WHAT IS TO BE DONE ?</span><h2 id="tagline-title">More than <em>just streaming.</em></h2><p>မြန်မာစာတန်းထိုး ရုပ်ရှင်နှင့် ဇာတ်လမ်းတွဲများကို လွယ်ကူစွာ ကြည့်ရှုနိုင်ရုံသာမက နေ့စဉ်ဘဝနဲ့ ချိတ်ဆက်နေတဲ့ digital entertainment platform တစ်ခု ဖြစ်လာစေရန် ဆက်လက်တည်ဆောက်နေပါတယ်။</p></section>
    <section className="container about-roadmap" aria-labelledby="roadmap-title">
      <div className="about-section-heading"><span className="eyebrow">THE ROADMAP</span><h1 id="roadmap-title">Building what comes next.</h1><p>Yangon TV ကို ပိုမိုကောင်းမွန်သော entertainment platform ဖြစ်လာစေရန် အဆင့်ဆင့် တည်ဆောက်နေပါတယ်။</p></div>
      <div className="roadmap-timeline">{phases.map((phase) => <PhaseCard key={phase.number} phase={phase} open={Boolean(openCards[phase.number])} onToggle={() => toggleCard(phase.number)} />)}</div>
    </section>

    <section className="container about-mission" aria-labelledby="mission-title"><div className="about-section-heading"><span className="eyebrow">MISSION &amp; VISION</span><h2 id="mission-title">Entertainment that is easy to find, easy to enjoy.</h2></div><div className="mission-grid"><article className="mission-card"><span className="mission-card__index">01</span><h3>Our Mission</h3><p>Yangon TV သည် မြန်မာစာတန်းထိုး ရုပ်ရှင်များ၊ ဇာတ်လမ်းတွဲများနှင့် entertainment content များကို လွယ်ကူစွာ ရှာဖွေကြည့်ရှုနိုင်ရန် တည်ဆောက်ထားသော online streaming platform ဖြစ်ပါတယ်။ အရည်အသွေးကောင်းမွန်မှု၊ လွယ်ကူသောအသုံးပြုမှုနှင့် သင့်တင့်သောစျေးနှုန်းကို အဓိကထားပါမည်။</p></article><article className="mission-card"><span className="mission-card__index">02</span><h3>Our Vision</h3><p>အနာဂတ်တွင် Yangon TV ကို ရုပ်ရှင်ကြည့်ရှုရာနေရာတစ်ခုအဖြစ်သာမက entertainment, knowledge, technology နှင့် original content များကို တစ်နေရာတည်းတွင် ရရှိနိုင်သော Myanmar digital media ecosystem တစ်ခုအဖြစ် တည်ဆောက်သွားမည်။</p></article></div></section>
    <section className="about-contact" aria-label="Contact Yangon TV"><div className="about-contact__marquee"><div className="about-contact__track"><span>လုပ်ငန်းပါတနာ၊ စီးပွားရေးမိတ်ဖက် သို့မဟုတ် အဖွဲ့အစည်းဆိုင်ရာ ဆက်သွယ်မေးမြန်းမှုများအတွက် အောက်ပါလမ်းကြောင်းများမှ တိုက်ရိုက်ဆက်သွယ်နိုင်ပါသည်။</span><span aria-hidden="true">လုပ်ငန်းပါတနာ၊ စီးပွားရေးမိတ်ဖက် သို့မဟုတ် အဖွဲ့အစည်းဆိုင်ရာ ဆက်သွယ်မေးမြန်းမှုများအတွက် အောက်ပါလမ်းကြောင်းများမှ တိုက်ရိုက်ဆက်သွယ်နိုင်ပါသည်။</span></div></div><div className="container about-contact__inner"><div className="about-contact__heading"><span className="eyebrow"><i aria-hidden="true" />CONTACT LINKS</span><small className="about-contact__reply">REPLY WITHIN 1–12 HRS</small></div><div className="about-contact__links"><a href="mailto:office@ygntv.org" aria-label="Email Yangon TV" className="about-contact__link"><span className="about-contact__icon about-contact__icon--mail"><Mail size={23} aria-hidden="true" /></span><span className="about-contact__link-label">MAIL</span></a><a href="https://t.me/officeygntvbot" target="_blank" rel="noreferrer" aria-label="Open Yangon TV Telegram" className="about-contact__link"><span className="about-contact__icon about-contact__icon--telegram"><Send size={23} aria-hidden="true" /></span><span className="about-contact__link-label">TELEGRAM</span></a><a href="https://messenger.com/yangontvfbpage" target="_blank" rel="noreferrer" aria-label="Open Yangon TV Messenger" className="about-contact__link"><span className="about-contact__icon about-contact__icon--messenger"><MessageCircle size={23} aria-hidden="true" /></span><span className="about-contact__link-label">MESSENGER</span></a></div></div></section>

  </div>;
}

export default AboutPage;
