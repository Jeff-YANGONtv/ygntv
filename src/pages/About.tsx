import { Check, GraduationCap, Layers3, Lightbulb, PlayCircle, Smartphone, Sparkles, Tv, Users } from 'lucide-react';
import '../styles/about.css';

const phases = [
  {
    number: '01',
    icon: PlayCircle,
    title: 'Platform Launch & Core Content',
    status: 'လက်ရှိကာလ',
    current: true,
    items: ['Web streaming platform တည်ဆောက်ခြင်း', 'High-quality ရုပ်ရှင်နှင့် ဇာတ်လမ်းတွဲများ စုံလင်စွာ ထည့်သွင်းခြင်း', 'တစ်လ ၂၅၀၀ ကျပ်ဖြင့် Unlimited Access ပေးအပ်ခြင်း'],
    goal: 'လွယ်ကူရှင်းလင်းသော အသုံးပြုမှုစနစ်နဲ့ အဓိကရုပ်ရှင်အကြောင်းအရာများကို တစ်နေရာတည်းတွင် ရရှိစေရန်။',
  },
  {
    number: '02',
    icon: Smartphone,
    title: 'Mobile Apps & Custom Features',
    items: ['Android နှင့် iOS dedicated applications', 'Offline download စနစ်', 'Subtitle နှင့် audio options များ ပိုမိုစုံလင်စွာ ထည့်သွင်းခြင်း'],
    goal: 'ဖုန်းအသုံးပြုသူများအတွက် ပိုမိုလွယ်ကူပြီး အဆင်ပြေစေရန်။',
  },
  {
    number: '03',
    icon: Tv,
    title: 'Ultra-Fast Streaming & Smart TV',
    items: ['Smart TV နှင့် Android TV app များ', 'Bandwidth တိုးမြှင့်ပြီး 4K streaming ကို ချောမွေ့စေခြင်း', 'AI-driven personalized recommendations'],
    goal: 'အိမ်တိုင်းရဲ့ ဧည့်ခန်းမှာ အကောင်းဆုံး ရုပ်ရှင်ရုံအတွေ့အကြုံ ရရှိစေရန်။',
  },
  {
    number: '04',
    icon: GraduationCap,
    title: 'Education & Original Content',
    items: ['အခမဲ့ IT ပညာပေးအစီအစဉ်များနှင့် Tech Talk Series', 'Original shows, talk shows, documentary နှင့် entertainment series များ', 'Yangon TV ကိုယ်ပိုင်ဖန်တီးမှုများ စတင်တင်ဆက်ခြင်း'],
    goal: 'ဖျော်ဖြေရေးအပြင် သင်ယူလေ့လာနိုင်တဲ့ Digital Media platform တစ်ခု ဖြစ်လာစေရန်။',
  },
];

const vision = [
  { icon: Lightbulb, title: 'Tech & Educational Empowerment', copy: 'မြန်မာ့ဒီဂျစ်တယ်နယ်ပယ် တိုးတက်စေရေးအတွက် IT ပညာဒါနအစီအစဉ်များနှင့် နည်းပညာစကားဝိုင်းများကို ဦးစားပေးတင်ဆက်သွားမည်။' },
  { icon: Sparkles, title: 'Original Content Creation', copy: 'Original shows, talk shows, documentary နှင့် entertainment series များကို အရည်အသွေးမြင့် ဖန်တီးထုတ်လုပ်သွားမည်။' },
  { icon: Layers3, title: 'Continuous Innovation', copy: 'နည်းပညာနှင့် ရုပ်သံအရည်အသွေးကို ခေတ်မီစံနှုန်းများနှင့်အညီ စဉ်ဆက်မပြတ် မြှင့်တင်သွားမည်။' },
];

export function AboutPage() {
  return <div className="page about-page">
    <section className="container about-hero">
      <span className="eyebrow">About Yangon TV</span>
      <h1>More than<br /><em>just streaming.</em></h1>
      <p>Yangon TV သည် နိုင်ငံတကာ ရုပ်ရှင်ကြီးများ၊ နာမည်ကြီး ဇာတ်လမ်းတွဲများနှင့် ရုပ်သံဖျော်ဖြေရေးအစီအစဉ်များကို မြန်မာစာတန်းထိုးဖြင့် ကြည်လင်ပြတ်သားစွာ တစ်နေရာတည်းမှာ ကြည့်ရှုနိုင်စေတဲ့ Online Streaming Platform ဖြစ်ပါတယ်။</p>
      <div className="about-hero__stats"><span><b>01</b><small>Entertainment home</small></span><span><b>∞</b><small>Stories to discover</small></span><span><b>MM</b><small>Made for Myanmar</small></span></div>
    </section>

    <section className="container about-intro"><div className="about-intro__mark"><Users size={28} /></div><div><span className="profile-card-label">Our mission</span><h2>အသက်သာဆုံးကုန်ကျစရိတ်နဲ့ အကောင်းဆုံးအတွေ့အကြုံ။</h2><p>ကြည့်ရှုသူတိုင်းအတွက် အရည်အသွေးကောင်းတဲ့ entertainment ကို လွယ်ကူစွာ ရရှိစေဖို့ Yangon TV ကို တည်ဆောက်နေပါတယ်။ လက်ရှိဝန်ဆောင်မှုတွေကို ပိုကောင်းအောင် ဆက်လက်ပြင်ဆင်ရင်း အနာဂတ် digital media experience ကိုလည်း အဆင့်ဆင့် အကောင်အထည်ဖော်သွားမယ်။</p></div></section>

    <section className="container about-roadmap"><div className="about-section-heading"><span className="eyebrow">The roadmap</span><h2>Building what comes next.</h2><p>Yangon TV ကို အစဉ်အမြဲ ဆန်းသစ်နေစေဖို့နဲ့ သုံးစွဲသူတွေရဲ့ လိုအပ်ချက်တွေကို ဖြည့်ဆည်းပေးနိုင်ဖို့ အဆင့်ဆင့် အကောင်အထည်ဖော်နေပါတယ်။</p></div><div className="about-phase-grid">{phases.map(({ number, icon: Icon, title, status, current, items, goal }) => <article className={`about-phase${current ? ' about-phase--current' : ''}`} key={number}><div className="about-phase__top"><span className="about-phase__number">{number}</span>{current ? <span className="about-phase__status"><i aria-hidden="true" />{status}</span> : <span className="about-phase__icon"><Icon size={20} /></span>}</div><h3>{title}</h3><ul>{items.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul><p className="about-phase__goal"><b>Goal</b>{goal}</p></article>)}</div></section>

    <section className="container about-vision"><div className="about-section-heading"><span className="eyebrow">Our future vision</span><h2>A digital home for<br /><em>knowledge & joy.</em></h2><p>သာမန် streaming platform တစ်ခုအဖြစ်သာမက ဗဟုသုတ၊ အသိပညာနဲ့ ဖျော်ဖြေရေးကို တစ်နေရာတည်းမှာ ရရှိနိုင်တဲ့ Digital Media & Tech Ecosystem တစ်ခုအဖြစ် တည်ဆောက်သွားရန် ရည်မှန်းထားပါတယ်။</p></div><div className="about-vision-grid">{vision.map(({ icon: Icon, title, copy }) => <article className="about-vision-card" key={title}><Icon size={22} /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  </div>;
}
