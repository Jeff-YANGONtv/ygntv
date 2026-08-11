import axios from 'axios';
import type { ApiPage, BlogPost, MediaItem } from './types';

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
  return pageFrom<MediaItem>(response.data, page);
}

export async function getSeries(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  const page = params.page || 1;
  const response = await api.get('/shows', { params: { page, search: params.search, genre: params.genre } });
  return pageFrom<MediaItem>(response.data, page);
}

export async function getMediaBySlug(kind: 'movie' | 'series', slug: string): Promise<MediaItem | null> {
  const response = await api.get(`/${kind === 'movie' ? 'movies' : 'shows'}/slug/${slug}`);
  return unwrap<MediaItem | null>(response.data) || null;
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
