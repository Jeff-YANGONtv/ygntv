export function yearFrom(value?: string | number): string {
  if (!value) return '—';
  return String(value).slice(0, 4);
}

export function pageTitle(title: string): string {
  return `${title} · Yangon TV`;
}

export function safeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
