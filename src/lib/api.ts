import axios from 'axios';
import { blogs as fallbackBlogs, movies as fallbackMovies, series as fallbackSeries } from '../data/mock';
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

function listFrom<T>(payload: unknown): T[] {
  const value = unwrap<unknown>(payload);
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as { data: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

function pageFrom<T>(payload: unknown, fallback: T[], page: number): ApiPage<T> {
  const value = unwrap<unknown>(payload);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nested = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : null;
    const rows = Array.isArray(record.data) ? record.data as T[] : nested && Array.isArray(nested.data) ? nested.data as T[] : listFrom<T>(value);
    const meta = (record.meta || nested?.meta || record) as Record<string, unknown>;
    return {
      data: rows,
      currentPage: Number(meta.current_page || meta.currentPage || page),
      lastPage: Number(meta.last_page || meta.lastPage || 1),
      total: Number(meta.total || rows.length),
    };
  }
  return { data: fallback, currentPage: page, lastPage: 1, total: fallback.length };
}

export async function getMovies(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  try {
    const response = await api.get('/movies', { params: { page: params.page || 1, search: params.search, genre: params.genre } });
    return pageFrom<MediaItem>(response.data, fallbackMovies, params.page || 1);
  } catch {
    const query = (params.search || '').toLowerCase();
    const filtered = fallbackMovies.filter((item) => !query || item.title.toLowerCase().includes(query));
    return { data: filtered, currentPage: 1, lastPage: 1, total: filtered.length };
  }
}

export async function getSeries(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  try {
    const response = await api.get('/shows', { params: { page: params.page || 1, search: params.search, genre: params.genre } });
    return pageFrom<MediaItem>(response.data, fallbackSeries, params.page || 1);
  } catch {
    const query = (params.search || '').toLowerCase();
    const filtered = fallbackSeries.filter((item) => !query || item.title.toLowerCase().includes(query));
    return { data: filtered, currentPage: 1, lastPage: 1, total: filtered.length };
  }
}

export async function getMediaBySlug(kind: 'movie' | 'series', slug: string): Promise<MediaItem | null> {
  const fallback = (kind === 'movie' ? fallbackMovies : fallbackSeries).find((item) => item.slug === slug) || null;
  try {
    const response = await api.get(`/${kind === 'movie' ? 'movies' : 'shows'}/slug/${slug}`);
    return unwrap<MediaItem>(response.data) || fallback;
  } catch {
    return fallback;
  }
}

export async function getBlogs(params: { page?: number; search?: string } = {}): Promise<ApiPage<BlogPost>> {
  try {
    const response = await api.get('/public/blogs', { params: { page: params.page || 1, search: params.search } });
    return pageFrom<BlogPost>(response.data, fallbackBlogs, params.page || 1);
  } catch {
    const query = (params.search || '').toLowerCase();
    const filtered = fallbackBlogs.filter((post) => !query || `${post.title} ${post.excerpt}`.toLowerCase().includes(query));
    return { data: filtered, currentPage: 1, lastPage: 1, total: filtered.length };
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const fallback = fallbackBlogs.find((post) => post.slug === slug) || null;
  try {
    const response = await api.get(`/public/blogs/${slug}`);
    return unwrap<BlogPost>(response.data) || fallback;
  } catch {
    return fallback;
  }
}
