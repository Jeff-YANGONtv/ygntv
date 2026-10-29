import type { MediaItem } from './types';

export type CatalogSort = 'default' | 'title' | 'year' | 'rating';
export function catalogView(items: MediaItem[], options: { query?: string; genre?: string; sort?: CatalogSort; page?: number; pageSize?: number }) {
  const query = (options.query || '').normalize('NFKC').trim().toLocaleLowerCase();
  const genre = (options.genre || '').toLocaleLowerCase();
  const filtered = items.filter((item) => (!query || `${item.title} ${(item.genres || []).join(' ')}`.normalize('NFKC').toLocaleLowerCase().includes(query)) && (!genre || (item.genres || []).some((value) => value.toLocaleLowerCase() === genre)));
  if (options.sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  if (options.sort === 'year') filtered.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  if (options.sort === 'rating') filtered.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
  const pageSize = Math.max(1, Math.floor(options.pageSize || 24));
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number(options.page || 1);
  const currentPage = Math.min(lastPage, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  return { data: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: filtered.length, currentPage, lastPage };
}
