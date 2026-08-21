import type { MediaItem } from './types';

type MediaRouteItem = Pick<MediaItem, 'kind' | 'slug'>;

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
