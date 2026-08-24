import type { BlogPost, MediaItem } from './types';

type MediaRouteItem = Pick<MediaItem, 'kind' | 'slug'>;
type BlogRouteItem = Pick<BlogPost, 'id' | 'slug' | 'published_at'> & { date?: string | null };

const generatedSlugSuffix = /-[a-f0-9]{10,}$/i;

export function publicMediaSlug(slug: string): string {
  const clean = slug.trim().replace(generatedSlugSuffix, '');
  return clean || slug;
}

export function mediaDetailPath(item: MediaRouteItem): string {
  const collection = item.kind === 'movie' ? 'movies' : 'series';
  return `/${collection}/${publicMediaSlug(item.slug)}`;
}

export function mediaWatchPath(item: MediaRouteItem, selection?: { season?: number; episode?: number }): string {
  const params = new URLSearchParams();
  if (Number.isFinite(selection?.season)) params.set('season', String(selection?.season));
  if (Number.isFinite(selection?.episode)) params.set('episode', String(selection?.episode));
  const query = params.toString();
  return `${mediaDetailPath(item)}/watch${query ? `?${query}` : ''}`;
}

export function blogPath(post: BlogRouteItem): string {
  const published = String(post.published_at || post.date || '');
  const year = /^\d{4}/.test(published) ? published.slice(0, 4) : new Date().getFullYear().toString();
  return `/blog/${encodeURIComponent(String(post.id))}-${year}/${encodeURIComponent(post.slug)}`;
}
