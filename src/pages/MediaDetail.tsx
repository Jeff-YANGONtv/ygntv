import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Download, Play, Share2, Star, Tv, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MediaCard, Pill, SectionHeading, ErrorState } from '../components/ui/Primitives';
import { getMediaBySlug, mediaUrl } from '../lib/api';
import { movies, series, seasons } from '../data/mock';
import type { MediaItem, Season } from '../lib/types';

export function MediaDetail({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openSeason, setOpenSeason] = useState(1);
  const [seasonData, setSeasonData] = useState<Season[]>([]);

  useEffect(() => { let mounted = true; setLoading(true); getMediaBySlug(kind, slug).then((value) => { if (mounted) { setItem(value); setLoading(false); } }).catch(() => { if (mounted) { setError(true); setLoading(false); } }); return () => { mounted = false; }; }, [kind, slug]);
  useEffect(() => { if (kind === 'series') setSeasonData(seasons); }, [kind]);
  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-detail" /></div>;
  if (error || !item) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;
  const related = (kind === 'movie' ? movies : series).filter((entry) => entry.slug !== item.slug).slice(0, 3);
  return <div className="page page-detail"><section className="detail-hero"><img src={mediaUrl(item.backdrop, item.backdrop)} alt="" /><div className="detail-shade" /><div className="container detail-hero-content"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button><div className="detail-layout"><img className="detail-poster" src={mediaUrl(item.poster, item.poster)} alt={`${item.title} poster`} /><div className="detail-copy"><div className="pills"><Pill>{kind === 'movie' ? 'Movie' : 'Series'}</Pill>{item.genres.slice(0, 2).map((genre) => <Pill key={genre}>{genre}</Pill>)}</div><h1>{item.title}</h1><div className="detail-meta"><span><Star size={14} fill="currentColor" /> {item.rating.toFixed(1)}</span><span><CalendarDays size={14} /> {item.year}</span><span>{kind === 'movie' ? <><Clock3 size={14} /> {item.runtime}</> : <><Tv size={14} /> {item.seasons} seasons</>}</span></div><p>{item.description}</p><div className="button-row"><Link className="button button--primary" to={`/${kind === 'movie' ? 'movies' : 'series'}/${item.slug}/watch`}><Play size={17} fill="currentColor" /> {kind === 'movie' ? 'Watch movie' : 'Start watching'}</Link><button className="button button--outline"><Download size={16} /> Download</button><button className="button button--icon" aria-label="Share title"><Share2 size={17} /></button></div></div></div></div></section>{kind === 'series' && <section className="container detail-section"><SectionHeading eyebrow="Keep watching" title="Episodes" /><div className="season-list">{seasonData.map((season) => <div className="season" key={season.id}><button className="season-heading" onClick={() => setOpenSeason(openSeason === season.number ? 0 : season.number)}><span><b>0{season.number}</b>{season.title}</span><span>{season.episodes.length} episodes</span></button>{openSeason === season.number && <div className="episode-list">{season.episodes.map((episode) => <Link className={`episode-row ${episode.available === false ? 'episode-row--disabled' : ''}`} to={episode.available === false ? '#' : `/series/${item.slug}/watch?episode=${episode.id}`} key={episode.id}><img src={episode.thumbnail} alt="" /><span className="episode-number">{String(episode.number).padStart(2, '0')}</span><span className="episode-title"><b>{episode.title}</b><small>{episode.duration} · {episode.available === false ? 'Coming soon' : 'Available now'}</small></span><Play size={16} fill="currentColor" /></Link>)}</div>}</div>)}</div></section>}<section className="container detail-section"><SectionHeading eyebrow="You might also like" title="More to discover" /><div className="media-grid">{related.map((entry) => <MediaCard key={entry.id} item={entry} />)}</div></section></div>;
}

export function WatchPage({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  useEffect(() => { getMediaBySlug(kind, slug).then(setItem); }, [kind, slug]);
  if (!item) return <div className="container page-loading"><div className="skeleton skeleton-player" /></div>;
  return <div className="page page-watch"><section className="container watch-top"><Link className="back-link" to={`/${kind === 'movie' ? 'movies' : 'series'}/${slug}`}><ArrowLeft size={15} /> Back to details</Link><div className="player-shell"><div className="player-placeholder"><div className="player-play"><Play size={26} fill="currentColor" /></div><span>Video source will appear here</span><small>Connect the Laravel media endpoint to start playback.</small></div></div><div className="watch-heading"><div><span className="eyebrow">Now watching</span><h1>{item.title}</h1></div><button className="button button--outline"><Download size={16} /> Download</button></div></section><section className="container watch-lower"><div className="watch-note"><Users size={18} /><div><b>Make it a Yangon TV night.</b><p>Use the episode list or explore more stories when you are ready.</p></div></div>{kind === 'series' && <div className="watch-episodes">{seasons[0].episodes.map((episode) => <Link key={episode.id} to={`/series/${slug}/watch?episode=${episode.id}`} className="watch-episode"><span>EP {String(episode.number).padStart(2, '0')}</span><b>{episode.title}</b><small>{episode.duration}</small></Link>)}</div>}</section></div>;
}
