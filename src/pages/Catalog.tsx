import { useEffect, useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getMovies, getSeries } from '../lib/api';
import type { MediaItem } from '../lib/types';
import { EmptyState, ErrorState, MediaCard, Pagination, Pill, SearchField, SkeletonGrid } from '../components/ui/Primitives';

export function CatalogPage({ kind }: { kind: 'movie' | 'series' }) {
  const [params, setParams] = useSearchParams();
  const query = params.get('search') || '';
  const genre = params.get('genre') || '';
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState(query);
  const [knownGenres, setKnownGenres] = useState<string[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => { setSearch(query); }, [kind, query]);
  useEffect(() => { setKnownGenres([]); }, [kind]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const loader = kind === 'movie' ? getMovies : getSeries;
    loader({ page, search: query, genre: genre || undefined }).then((result) => {
      if (cancelled) return;
      const finalPage = Math.max(1, result.lastPage);
      if (page > finalPage) {
        setParams({ ...(query ? { search: query } : {}), ...(genre ? { genre } : {}), ...(finalPage > 1 ? { page: String(finalPage) } : {}) }, { replace: true });
        return;
      }
      setItems(result.data);
      setLastPage(finalPage);
      setTotal(result.total);
      setKnownGenres((current) => Array.from(new Set([...current, ...result.data.flatMap((item) => item.genres || [])])).filter(Boolean));
    }).catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind, page, query, genre, retryAttempt, setParams]);

  const title = kind === 'movie' ? 'Movies' : 'Series';
  const description = kind === 'movie' ? 'မြန်မာစာတန်းထိုးနိုင်ငံတကာရုပ်ရှင်ဇာတ်ကားများ' : 'မြန်မာစာတန်းထိုး နိုင်ငံတကာရုပ်သံဇာတ်လမ်းတွဲများ';
  const availableGenres = useMemo(() => ['All', ...Array.from(new Set([...(genre ? [genre] : []), ...knownGenres])).sort((left, right) => left.localeCompare(right))], [knownGenres, genre]);
  const setFilters = (nextQuery: string, nextGenre: string, nextPage = 1) => {
    setParams({ ...(nextQuery ? { search: nextQuery } : {}), ...(nextGenre ? { genre: nextGenre } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) });
  };
  const submitSearch = () => {
    const nextQuery = search.trim();
    if (nextQuery === query && page === 1) setRetryAttempt((value) => value + 1);
    else setFilters(nextQuery, genre);
  };

  return <div className="page page-catalog">
    <section className="container page-heading"><div><span className="eyebrow">The collection</span><h1>{title}</h1><p>{description}</p></div></section>
    <section className="container catalog-toolbar">
      <SearchField value={search} onChange={setSearch} onSubmit={submitSearch} placeholder={`Search ${title.toLowerCase()}...`} />
      <div className="toolbar-label"><Filter size={16} /> Filter by genre</div>
      <div className="pills">{availableGenres.map((value) => <Pill key={value} active={(genre || 'All') === value} onClick={() => setFilters(query, value === 'All' ? '' : value)}>{value}</Pill>)}</div>
      {(query || genre) && <button className="text-link" type="button" onClick={() => setFilters('', '')}>Clear filters</button>}
    </section>
    <section className="container catalog-results" aria-busy={loading}>
      {loading ? <div role="status" aria-label={`Loading ${title.toLowerCase()}`}><SkeletonGrid count={6} /></div> : error ? <ErrorState onRetry={() => setRetryAttempt((value) => value + 1)} /> : <>
        <p role="status" aria-live="polite">{total} {title.toLowerCase()} found{query ? ` for “${query}”` : ''}{genre ? ` in ${genre}` : ''}.</p>
        {items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} copy="Try clearing your filters or searching for another title." /> : <>
          <div className="media-grid">{items.map((item) => <MediaCard key={item.id} item={item} />)}</div>
          <Pagination page={page} lastPage={lastPage} onChange={(nextPage) => { setFilters(query, genre, nextPage); window.scrollTo({ top: 0, behavior: 'auto' }); }} />
        </>}
      </>}
    </section>
  </div>;
}
