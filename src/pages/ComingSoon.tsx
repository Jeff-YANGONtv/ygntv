import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { Logo } from '../components/ui/Primitives';
import '../styles/coming-soon.css';

const RELEASE_AT = Date.UTC(2026, 11, 31, 17, 30, 0); // 2027-01-01 00:00 in Yangon (UTC+06:30)
const TELEGRAM_URL = 'https://telegram.me/yangontv';
const REDIRECT_AFTER_MS = 15_000;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

function getCountdown(now = Date.now()): Countdown {
  let remaining = Math.max(0, RELEASE_AT - now);
  const days = Math.floor(remaining / DAY_MS);
  remaining %= DAY_MS;
  const hours = Math.floor(remaining / HOUR_MS);
  remaining %= HOUR_MS;
  const minutes = Math.floor(remaining / MINUTE_MS);
  remaining %= MINUTE_MS;
  return { days, hours, minutes, seconds: Math.floor(remaining / 1000) };
}

function formatPart(value: number) {
  return String(value).padStart(2, '0');
}

export function ComingSoonPage() {
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown());

  useEffect(() => {
    const countdownTimer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    const redirectTimer = window.setTimeout(() => window.location.replace(TELEGRAM_URL), REDIRECT_AFTER_MS);
    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(redirectTimer);
    };
  }, []);

  return (
    <main className="coming-soon">
      <img className="coming-soon__image" src="/cinema-coming-soon.jpg" alt="" fetchPriority="high" />
      <div className="coming-soon__shade" aria-hidden="true" />
      <div className="coming-soon__layout">
        <header className="container coming-soon__header">
          <Logo />
          <span className="coming-soon__status"><span aria-hidden="true" /> NEW CHAPTER · 2027</span>
        </header>

        <section className="container coming-soon__content" aria-labelledby="coming-soon-title">
          <p className="eyebrow eyebrow--light coming-soon__eyebrow"><Sparkles size={14} aria-hidden="true" /> A NEW YANGON TV EXPERIENCE</p>
          <h1 id="coming-soon-title" className="coming-soon__title">
            ဖျော်ဖြေရေး အတွေ့အကြုံသစ်နဲ့<br /><em>မကြာမီ</em> ပြန်လာပါတော့မယ်
          </h1>
          <p className="coming-soon__intro">
            ရုပ်ရှင်၊ ဇာတ်လမ်းတွဲနဲ့ သင်နှစ်သက်တဲ့ အစီအစဉ်တွေကို ပိုမိုကောင်းမွန်တဲ့ အတွေ့အကြုံသစ်နဲ့ တင်ဆက်နိုင်ဖို့ ပြင်ဆင်နေပါတယ်။ ခဏလေးစောင့်ပေးပါနော်။
          </p>

          <section className="coming-soon__launch" aria-label="ပြန်လည်စတင်မည့်အချိန်အထိ">
            <div className="coming-soon__launch-heading">
              <span className="coming-soon__launch-label">ပြန်လည်စတင်မည့်အချိန်အထိ</span>
              <span className="coming-soon__timezone">YANGON · UTC+6:30</span>
            </div>
            <p className="coming-soon__date"><CalendarDays size={17} aria-hidden="true" /><time dateTime="2027-01-01T00:00:00+06:30">၂၀၂၇ ခုနှစ်၊ ဇန်နဝါရီ ၁ ရက်</time></p>
            <div className="coming-soon__countdown" role="timer" aria-label="မြန်မာစံတော်ချိန်ဖြင့် ၂၀၂၇ ခုနှစ် ဇန်နဝါရီ ၁ ရက်အထိ ကျန်ရှိချိန်" aria-live="off">
              <div className="coming-soon__time"><strong>{countdown.days}</strong><span>ရက်</span></div>
              <div className="coming-soon__time"><strong>{formatPart(countdown.hours)}</strong><span>နာရီ</span></div>
              <div className="coming-soon__time"><strong>{formatPart(countdown.minutes)}</strong><span>မိနစ်</span></div>
              <div className="coming-soon__time"><strong>{formatPart(countdown.seconds)}</strong><span>စက္ကန့်</span></div>
            </div>
          </section>

          <p className="coming-soon__redirect-note"><span aria-hidden="true" /> ယခု စာမျက်နှာမှ Telegram သို့ အလိုအလျောက် ပြောင်းရွှေ့ပေးပါမည်။</p>
          <div className="coming-soon__actions">
            <a className="button button--primary" href={TELEGRAM_URL} aria-label="Telegram သို့ ချက်ချင်းဆက်သွားမည်">
              Telegram သို့ ချက်ချင်းဆက်သွားမည် <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a className="coming-soon__destination" href={TELEGRAM_URL}>telegram.me/yangontv</a>
          </div>
        </section>

        <footer className="container coming-soon__footer">
          <span>© 2026 YANGON TV · MADE FOR MYANMAR</span>
          <span>Cinema photo via <a href="https://unsplash.com/" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
        </footer>
      </div>
    </main>
  );
}
