import { useEffect } from 'react';
import '../styles/coming-soon.css';

const TELEGRAM_URL = 'https://telegram.me/yangontv';
const REDIRECT_AFTER_MS = 15_000;

export function ComingSoonPage() {
  useEffect(() => {
    const redirectTimer = window.setTimeout(() => window.location.replace(TELEGRAM_URL), REDIRECT_AFTER_MS);
    return () => window.clearTimeout(redirectTimer);
  }, []);

  return (
    <main className="coming-soon" aria-label="COMING SOON">
      <img className="coming-soon__image" src="/cinema-coming-soon.jpg" alt="" fetchPriority="high" />
      <div className="coming-soon__shade" aria-hidden="true" />
      <h1 className="coming-soon__title">COMING <span>SOON</span></h1>
    </main>
  );
}
