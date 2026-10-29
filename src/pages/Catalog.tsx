import { useEffect, useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getMovies, getSeries } from '../lib/api';
import { catalogView, type CatalogSort } from '../lib/catalog-state';
import type { MediaItem } from '../lib/types';
import { EmptyState, ErrorState, MediaCard, Pagination, Pill, SearchField, SkeletonGrid } from '../components/ui/Primitives';
import '../styles/catalog-flow.css';

type CatalogKind = 'movie' | 'series';
const cache = new Map<CatalogKind, { savedAt: number; items: MediaItem[] }>();
const pending = new Map<CatalogKind, Promise<MediaItem[]>>();
async function loadCatalog(kind: CatalogKind, refresh: boolean): Promise<MediaItem[]> {
  const cached = cache.get(kind);
  if (!refresh && cached && cached.savedAt > Date.now() - 300000) return cached.items;
  const current = pending.get(kind);
  if (current) return current;
  const request = (async () => {
    const loader = kind === 'movie' ? getMovies : getSeries;
    const first = await loader({ page: 1 });
    const items = [...first.data];
    for (let page = 2; page <= first.lastPage; page += 4) {
      const batch = await Promise.all(Array.from({ length: Math.min(4, first.lastPage - page + 1) }, (_, index) => loader({ page: page + index })));
      batch.forEach((result) => items.push(...result.data));
    }
    const unique = Array.from(new Map(items.map((item) => [String(item.id), item])).values());
    cache.set(kind, { savedAt: Date.now(), items: unique });
    return unique;
  })().finally(() => pending.delete(kind));
  pending.set(kind, request);
  return request;
}

export function CatalogPage({ kind }: { kind: CatalogKind }) {
  const [params, setParams] = useSearchParams();
  const query = params.get('search') || '';
  const genre = params.get('genre') || '';
  const rawSort = params.get('sort');
  const sort: CatalogSort = rawSort === 'title' || rawSort === 'year' || rawSort === 'rating' ? rawSort : 'default';
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const view = useMemo(() => catalogView(items, { query, genre, sort, page }), [items, query, genre, sort, page]);

  useEffect(() => { setSearch(query); }, [kind, query]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    loadCatalog(kind, retryAttempt > 0).then((result) => { if (!cancelled) setItems(result); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind, retryAttempt]);
  useEffect(() => {
    if (!loading && !error && page !== view.currentPage) setParams({ ...(query ? { search: query } : {}), ...(genre ? { genre } : {}), ...(sort !== 'default' ? { sort } : {}), ...(view.currentPage > 1 ? { page: String(view.currentPage) } : {}) }, { replace: true });
  }, [loading, error, page, view.currentPage, query, genre, sort, setParams]);

  const title = kind === 'movie' ? 'Movies' : 'Series';
  const description = kind === 'movie' ? 'မြန်မာစာတန်းထိုးနိုင်ငံတကာရုပ်ရှင်ဇာတ်ကားများ' : 'မြန်မာစာတန်းထိုး နိုင်ငံတကာရုပ်သံဇာတ်လမ်းတွဲများ';
  const availableGenres = useMemo(() => ['All', ...Array.from(new Set([...(genre ? [genre] : []), ...items.flatMap((item) => item.genres || [])])).sort((left, right) => left.localeCompare(right))], [items, genre]);
  const setFilters = (nextQuery: string, nextGenre: string, nextPage = 1, nextSort = sort) => setParams({ ...(nextQuery ? { search: nextQuery } : {}), ...(nextGenre ? { genre: nextGenre } : {}), ...(nextSort !== 'default' ? { sort: nextSort } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) });

  return <div className="page page-catalog">
    <section className="container page-heading"><div><span className="eyebrow">The collection</span><h1>{title}</h1><p>{description}</p></div></section>
    <section className="container catalog-toolbar">
      <SearchField value={search} onChange={setSearch} onSubmit={() => setFilters(search.trim(), genre)} placeholder={`Search ${title.toLowerCase()}...`} />
      <div className="toolbar-label"><Filter size={16} /> Filter by genre</div>
      <div className="pills">{availableGenres.map((value) => <Pill key={value} active={(genre || 'All') === value} onClick={() => setFilters(query, value === 'All' ? '' : value)}>{value}</Pill>)}</div>
      <div className="catalog-options"><label className="catalog-sort">Sort<select value={sort} onChange={(event) => setFilters(query, genre, 1, event.target.value as CatalogSort)}><option value="default">Default order</option><option value="title">Title A–Z</option><option value="year">Newest release</option><option value="rating">Highest rated</option></select></label>{(query || genre) && <button className="text-link" type="button" onClick={() => setFilters('', '')}>Clear filters</button>}</div>
    </section>
    <section className="container catalog-results" aria-busy={loading}>
      {loading ? <div role="status" aria-label={`Loading ${title.toLowerCase()}`}><SkeletonGrid count={6} /></div> : error ? <ErrorState onRetry={() => setRetryAttempt((value) => value + 1)} /> : <>
        <p role="status" aria-live="polite">{view.total} {title.toLowerCase()} found{query ? ` for “${query}”` : ''}{genre ? ` in ${genre}` : ''}.</p>
        {view.data.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} copy="Try clearing your filters or searching for another title." /> : <>
          <div className="media-grid">{view.data.map((item) => <MediaCard key={item.id} item={item} />)}</div>
          <Pagination page={view.currentPage} lastPage={view.lastPage} onChange={(nextPage) => { setFilters(query, genre, nextPage); window.scrollTo({ top: 0, behavior: 'auto' }); }} />
        </>}
      </>}
    </section>
  </div>;
}
