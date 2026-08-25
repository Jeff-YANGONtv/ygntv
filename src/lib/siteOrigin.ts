const configuredOrigin = String(import.meta.env.VITE_SITE_ORIGIN || '').trim().replace(/\/$/, '');
const fallbackOrigin = 'https://ygntv.vercel.app';

export function activeSiteOrigin(): string {
  if (configuredOrigin) return configuredOrigin;
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin.replace(/\/$/, '');
  return fallbackOrigin;
}
