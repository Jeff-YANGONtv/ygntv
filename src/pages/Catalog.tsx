import { useEffect, useMemo, useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getMovies, getSeries } from '../lib/api';
import type { MediaItem } from '../lib/types';
import { EmptyState, ErrorState, MediaCard, Pagination, Pill, SearchField, SectionHeading, SkeletonGrid } from '../components/ui/Primitives';

export function CatalogPage({ kind }: { kind: 'movie' | 'series' }) {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [query, setQuery] = useState(params.get('search') || '');
  const [genre, setGenre] = useState(params.get('genre') || '');
  const [page, setPage] = useState(Number(params.get('page') || 1));
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const loader = kind === 'movie' ? getMovies : getSeries;
    loader({ page, search: query, genre: genre || undefined }).then((result) => {
      if (cancelled) return;
      setItems(result.data);
      setLastPage(result.lastPage);
      setTotal(result.total);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [kind, page, query, genre]);

  const title = kind === 'movie' ? 'Movies' : 'Series';
  const description = kind === 'movie' ? 'မြန်မာစာတန်းထိုးနိုင်ငံတကာရုပ်ရှင်ဇာတ်ကားကောင်းများ' : 'မြန်မာစာတန်းထိုး နိုင်ငံတကာရုပ်သံစီးရီးဇာတ်လမ်းတွဲများ';
  const availableGenres = useMemo(() => {
    const values = items.flatMap((item) => item.genres || []).filter(Boolean);
    return Array.from(new Set(['All', ...(genre ? [genre] : []), ...values])).sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
  }, [items, genre]);
  const activeGenre = genre || 'All';
  const updateFilters = (nextGenre: string) => {
    const next = nextGenre === 'All' ? '' : nextGenre;
    setGenre(next);
    setPage(1);
    setParams({ ...(query ? { search: query } : {}), ...(next ? { genre: next } : {}) });
  };
  const submitSearch = () => {
    setQuery(search);
    setPage(1);
    setParams({ ...(search ? { search } : {}), ...(genre ? { genre } : {}) });
  };

  return <div className="page page-catalog"><section className="container page-heading"><div><span className="eyebrow">The collection</span><h1>{title}</h1><p>{description}</p></div></section><section className="container catalog-toolbar"><SearchField value={search} onChange={setSearch} onSubmit={submitSearch} placeholder={`Search ${title.toLowerCase()}...`} /><div className="toolbar-label"><Filter size={16} /> Filter by genre</div>{availableGenres.length > 1 ? <div className="pills">{availableGenres.map((item) => <Pill key={item} active={activeGenre === item} onClick={() => updateFilters(item)}>{item}</Pill>)}</div> : <p className="results-context">Genres will appear when the backend returns catalog metadata.</p>}<button className="sort-button"><SlidersHorizontal size={16} /> Recently added</button></section><section className="container catalog-results">{loading ? <SkeletonGrid count={6} /> : error ? <ErrorState onRetry={submitSearch} /> : items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} copy="Try clearing your filters or searching for another title." /> : <><div className="results-bar"><span>Showing <b>{items.length}</b> {title.toLowerCase()}</span><span className="results-context">Curated for your next watch</span></div><div className="media-grid">{items.map((item) => <MediaCard key={item.id} item={item} />)}</div><Pagination page={page} lastPage={lastPage} onChange={(next) => { setPage(next); setParams({ ...(query ? { search: query } : {}), ...(genre ? { genre } : {}), page: String(next) }); }} /></>}</section></div>;
}
