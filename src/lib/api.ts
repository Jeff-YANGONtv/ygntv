import axios from 'axios';
import type { ApiPage, BlogPost, MediaItem, SocialLink } from './types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khaki-yak-457838.hostingersite.com/api';
export const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL || 'https://khaki-yak-457838.hostingersite.com';

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

export function mediaUrl(value?: string | null, fallback = ''): string {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  return `${mediaBaseUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return stringArray(parsed);
  } catch {
    // Laravel JSON columns are normally decoded by the API; keep plain URLs supported too.
  }
  return [value.trim()];
}

export function normalizeMediaItem(raw: unknown, fallbackKind: 'movie' | 'series'): MediaItem {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const releaseDate = String(source.release_date ?? source.date ?? '');
  const title = String(source.title ?? source.name ?? 'Untitled');
  const poster = String(source.poster ?? source.poster_url ?? source.poster_path ?? '');
  const backdrop = String(source.backdrop ?? source.backdrop_url ?? source.backdrop_path ?? poster);
  const synopsis = String(source.synopsis ?? source.review ?? source.description ?? '');
  const kind = source.kind === 'series' || source.kind === 'movie' ? source.kind : fallbackKind;
  const rating = Number(source.rating ?? source.vote_average ?? 0);
  const genres = stringArray(source.genres);
  const casts = stringArray(source.casts ?? source.cast);
  const streamingLinks = stringArray(source.streamingLinks ?? source.streaming_links ?? source.stream_url ?? source.stream);
  const downloadLinks = stringArray(source.downloadLinks ?? source.download_links ?? source.download_url ?? source.download);

  return {
    id: (source.id as number | string | undefined) ?? title,
    slug: String(source.slug ?? ''),
    title,
    originalTitle: source.originalTitle ? String(source.originalTitle) : undefined,
    kind,
    year: String(source.year ?? (releaseDate ? releaseDate.slice(0, 4) : '')),
    rating: Number.isFinite(rating) ? rating : 0,
    runtime: source.runtime ? String(source.runtime) : undefined,
    genres,
    casts,
    synopsis,
    description: String(source.description ?? synopsis),
    poster,
    backdrop,
    streamingLinks,
    downloadLinks,
    featured: Boolean(source.featured),
    badge: source.badge ? String(source.badge) : undefined,
    seasons: source.seasons == null ? undefined : Number(source.seasons),
    episodes: source.episodes == null ? undefined : Number(source.episodes),
  };
}

function normalizePage(page: ApiPage<MediaItem>, kind: 'movie' | 'series'): ApiPage<MediaItem> {
  return { ...page, data: page.data.map((entry) => normalizeMediaItem(entry, kind)) };
}

function pageFrom<T>(payload: unknown, page: number): ApiPage<T> {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
  const nested = root?.data && typeof root.data === 'object' && !Array.isArray(root.data)
    ? root.data as Record<string, unknown>
    : null;
  const rows = Array.isArray(payload)
    ? payload as T[]
    : Array.isArray(root?.data)
      ? root.data as T[]
      : nested && Array.isArray(nested.data)
        ? nested.data as T[]
        : root && Array.isArray(root.items)
          ? root.items as T[]
          : [];
  const meta = (root?.meta && typeof root.meta === 'object'
    ? root.meta
    : nested?.meta && typeof nested.meta === 'object'
      ? nested.meta
      : root) as Record<string, unknown> | null;
  return {
    data: rows,
    currentPage: Number(meta?.current_page || meta?.currentPage || page),
    lastPage: Number(meta?.last_page || meta?.lastPage || 1),
    total: Number(meta?.total || rows.length),
  };
}

export async function getMovies(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  const page = params.page || 1;
  const response = await api.get('/movies', { params: { page, search: params.search, genre: params.genre } });
  return normalizePage(pageFrom<MediaItem>(response.data, page), 'movie');
}

export async function getSeries(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  const page = params.page || 1;
  const response = await api.get('/shows', { params: { page, search: params.search, genre: params.genre } });
  return normalizePage(pageFrom<MediaItem>(response.data, page), 'series');
}

export async function getMediaBySlug(kind: 'movie' | 'series', slug: string): Promise<MediaItem | null> {
  const response = await api.get(`/${kind === 'movie' ? 'movies' : 'shows'}/slug/${slug}`);
  const raw = unwrap<unknown>(response.data);
  return raw ? normalizeMediaItem(raw, kind) : null;
}

export async function getBlogs(params: { page?: number; search?: string } = {}): Promise<ApiPage<BlogPost>> {
  const page = params.page || 1;
  const response = await api.get('/public/blogs', { params: { page, search: params.search } });
  return pageFrom<BlogPost>(response.data, page);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const response = await api.get(`/public/blogs/${slug}`);
  return unwrap<BlogPost | null>(response.data) || null;
}

export async function getSocials(): Promise<SocialLink[]> {
  const response = await api.get('/socials');
  const rows = unwrap<SocialLink[] | null>(response.data);
  return Array.isArray(rows) ? rows : [];
}
