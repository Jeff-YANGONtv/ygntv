import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Download, Play, Share2, Star, Tv, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MediaCard, Pill, SectionHeading, EmptyState, ErrorState } from '../components/ui/Primitives';
import { getMediaBySlug, getMovies, getSeries, mediaUrl } from '../lib/api';
import type { MediaItem } from '../lib/types';

export function MediaDetail({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [related, setRelated] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    const loader = kind === 'movie' ? getMovies : getSeries;
    Promise.all([getMediaBySlug(kind, slug), loader({ page: 1 })]).then(([value, listing]) => {
      if (!mounted) return;
      setItem(value);
      setRelated(listing.data.filter((entry) => entry.slug !== slug).slice(0, 3));
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [kind, slug]);
  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-detail" /></div>;
  if (error || !item) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;
  return <div className="page page-detail"><section className="detail-hero"><img src={mediaUrl(item.backdrop, item.poster)} alt="" /><div className="detail-shade" /><div className="container detail-hero-content"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button><div className="detail-layout"><img className="detail-poster" src={mediaUrl(item.poster)} alt={`${item.title} poster`} /><div className="detail-copy"><div className="pills"><Pill>{kind === 'movie' ? 'Movie' : 'Series'}</Pill>{(item.genres || []).slice(0, 2).map((genre) => <Pill key={genre}>{genre}</Pill>)}</div><h1>{item.title}</h1><div className="detail-meta"><span><Star size={14} fill="currentColor" /> {item.rating.toFixed(1)}</span><span><CalendarDays size={14} /> {item.year}</span><span>{kind === 'movie' ? <><Clock3 size={14} /> {item.runtime || 'Feature'}</> : <><Tv size={14} /> {item.seasons || 0} seasons</>}</span></div><p>{item.synopsis || item.description}</p><div className="button-row"><Link className="button button--primary" to={`/${kind === 'movie' ? 'movies' : 'series'}/${item.slug}/watch`}><Play size={17} fill="currentColor" /> {kind === 'movie' ? 'Watch movie' : 'Start watching'}</Link><button className="button button--outline"><Download size={16} /> Download</button><button className="button button--icon" aria-label="Share title"><Share2 size={17} /></button></div></div></div></div></section><section className="container detail-section detail-extra-grid"><div className="detail-extra-card"><span className="eyebrow">Synopsis</span><p>{item.synopsis || item.description || 'No synopsis available.'}</p></div><div className="detail-extra-card"><span className="eyebrow">Cast</span>{item.casts?.length ? <div className="cast-list">{item.casts.map((cast) => <span className="cast-chip" key={cast}>{cast}</span>)}</div> : <p>No cast information available.</p>}</div></section>{kind === 'series' && <section className="container detail-section"><SectionHeading eyebrow="Keep watching" title="Episodes" /><EmptyState title="Episodes are managed by the backend" copy={item.episodes ? `${item.episodes} episodes are available for this series.` : 'Episode information will appear when the backend provides it.'} /></section>}<section className="container detail-section"><SectionHeading eyebrow="You might also like" title="More to discover" />{related.length ? <div className="media-grid">{related.map((entry) => <MediaCard key={entry.id} item={entry} />)}</div> : <EmptyState title="No related titles" copy="Explore the catalog for more stories." />}</section></div>;
}

export function WatchPage({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    getMediaBySlug(kind, slug).then((value) => {
      if (mounted) setItem(value);
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [kind, slug]);
  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-player" /></div>;
  if (error || !item) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;
  return <div className="page page-watch"><section className="container watch-top"><Link className="back-link" to={`/${kind === 'movie' ? 'movies' : 'series'}/${slug}`}><ArrowLeft size={15} /> Back to details</Link><div className="player-shell"><div className="player-placeholder"><div className="player-play"><Play size={26} fill="currentColor" /></div><span>Video source will appear here</span><small>Connect the Laravel media endpoint to start playback.</small></div></div><div className="watch-heading"><div><span className="eyebrow">Now watching</span><h1>{item.title}</h1></div><button className="button button--outline"><Download size={16} /> Download</button></div></section><section className="container watch-lower"><div className="watch-note"><Users size={18} /><div><b>Make it a Yangon TV night.</b><p>Playback metadata and episode information will come from the backend.</p></div></div></section></div>;
}
