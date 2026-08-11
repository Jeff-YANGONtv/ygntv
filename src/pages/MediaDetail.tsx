import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Download, Play, Share2, Star, Tv, Users } from 'lucide-react';
import Hls from 'hls.js';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MediaCard, Pill, SectionHeading, EmptyState, ErrorState } from '../components/ui/Primitives';
import { getMediaBySlug, getMovies, getSeries, mediaUrl } from '../lib/api';
import type { MediaItem } from '../lib/types';

function safeFilename(title: string): string {
  return `${title.replace(/[^a-z0-9ก-๙\u1000-\u109f]+/gi, '-').replace(/^-|-$/g, '') || 'yangon-tv-video'}.mp4`;
}

function DownloadAction({ links, title }: { links: string[]; title: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    const source = links[0];
    if (!source || downloading) return;
    const url = mediaUrl(source);
    setDownloading(true);
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`Download failed with ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = safeFilename(title);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Some file hosts intentionally disallow CORS. Opening the direct URL still lets
      // the host's own download response work instead of leaving the button inert.
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      className="button button--outline"
      onClick={handleDownload}
      disabled={!links.length || downloading}
      title={links.length ? 'Download this title' : 'No download link is available'}
    >
      <Download size={16} />
      {downloading ? 'Preparing…' : links.length ? 'Download' : 'Download unavailable'}
    </button>
  );
}

function directMediaUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const match = parsed.pathname.match(/^\/watch\/([^/]+)\//i);
    if (match && /filescloud\.workers\.dev$/i.test(parsed.hostname)) {
      parsed.pathname = `/${match[1]}`;
      return parsed.href;
    }
  } catch {
    // Keep the original value and let the player surface any invalid URL error.
  }
  return value;
}

function VideoPlayer({ source, poster, title }: { source: string; poster?: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerError, setPlayerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sourceUrl = mediaUrl(source);
  const resolvedSource = directMediaUrl(sourceUrl);
  const resolvedPoster = poster ? mediaUrl(poster) : undefined;
  const isUnsupportedWatchPage = /\/watch(?:\/|$)/i.test(resolvedSource);

  useEffect(() => {
    const video = videoRef.current;
    if (isUnsupportedWatchPage || !video || !resolvedSource) return;
    let hls: Hls | null = null;
    let timeoutId = 0;
    const isHls = /\.m3u8(?:$|[?#])/i.test(resolvedSource);
    const markLoaded = () => {
      setIsLoading(false);
      window.clearTimeout(timeoutId);
    };
    const showError = () => {
      setIsLoading(false);
      window.clearTimeout(timeoutId);
      setPlayerError('This video server did not return playable data. Please replace the streaming URL in the admin panel.');
    };

    setPlayerError('');
    setIsLoading(true);
    timeoutId = window.setTimeout(() => {
      setIsLoading(false);
      setPlayerError('The streaming server did not send video data. Please add a new direct MP4 or HLS URL.');
    }, 15000);
    video.addEventListener('loadedmetadata', markLoaded);
    video.addEventListener('canplay', markLoaded);
    video.addEventListener('error', showError);

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(resolvedSource);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError();
          else showError();
        }
      });
    } else if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = resolvedSource;
      video.load();
    } else {
      showError();
    }

    return () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', markLoaded);
      video.removeEventListener('canplay', markLoaded);
      video.removeEventListener('error', showError);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [isUnsupportedWatchPage, resolvedSource]);

  if (!source) {
    return (
      <div className="player-placeholder player-empty">
        <div className="player-play"><Play size={26} fill="currentColor" /></div>
        <span>Video source is not available</span>
        <small>The backend has not provided a streaming URL for this title yet.</small>
      </div>
    );
  }

  if (isUnsupportedWatchPage) {
    return (
      <div className="player-placeholder player-empty">
        <div className="player-play"><Play size={26} fill="currentColor" /></div>
        <span>Unsupported watch-page link</span>
        <small>Please save a direct MP4 or HLS (.m3u8) streaming URL in the admin panel.</small>
      </div>
    );
  }

  return (
    <div className="player-frame">
      <video ref={videoRef} className="video-player" controls playsInline preload="metadata" poster={resolvedPoster} aria-label={`Play ${title}`} />
      {isLoading && <div className="player-loading" aria-live="polite">Connecting to the streaming server…</div>}
      {playerError && <div className="player-error" role="alert"><span>{playerError}</span> <a href={resolvedSource} target="_blank" rel="noreferrer">Open source</a></div>}
    </div>
  );
}

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

  return (
    <div className="page page-detail">
      <section className="detail-hero">
        <img src={mediaUrl(item.backdrop, item.poster)} alt="" />
        <div className="detail-shade" />
        <div className="container detail-hero-content">
          <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>
          <div className="detail-layout">
            <img className="detail-poster" src={mediaUrl(item.poster)} alt={`${item.title} poster`} />
            <div className="detail-copy">
              <div className="pills">
                <Pill>{kind === 'movie' ? 'Movie' : 'Series'}</Pill>
                {(item.genres || []).slice(0, 2).map((genre) => <Pill key={genre}>{genre}</Pill>)}
              </div>
              <h1>{item.title}</h1>
              <div className="detail-meta">
                <span><Star size={14} fill="currentColor" /> {item.rating.toFixed(1)}</span>
                <span><CalendarDays size={14} /> {item.year}</span>
                <span>{kind === 'movie' ? <><Clock3 size={14} /> {item.runtime || 'Feature'}</> : <><Tv size={14} /> {item.seasons || 0} seasons</>}</span>
              </div>
              <p>{item.synopsis || item.description}</p>
              <div className="button-row">
                <Link className="button button--primary" to={`/${kind === 'movie' ? 'movies' : 'series'}/${item.slug}/watch`}><Play size={17} fill="currentColor" /> {kind === 'movie' ? 'Watch movie' : 'Start watching'}</Link>
                <DownloadAction links={item.downloadLinks} title={item.title} />
                <button className="button button--icon" aria-label="Share title"><Share2 size={17} /></button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container detail-section detail-extra-grid">
        <div className="detail-extra-card"><span className="eyebrow">Synopsis</span><p>{item.synopsis || item.description || 'No synopsis available.'}</p></div>
        <div className="detail-extra-card"><span className="eyebrow">Cast</span>{item.casts?.length ? <div className="cast-list">{item.casts.map((cast) => <span className="cast-chip" key={cast}>{cast}</span>)}</div> : <p>No cast information available.</p>}</div>
      </section>
      {kind === 'series' && <section className="container detail-section"><SectionHeading eyebrow="Keep watching" title="Episodes" /><EmptyState title="Episodes are managed by the backend" copy={item.episodes ? `${item.episodes} episodes are available for this series.` : 'Episode information will appear when the backend provides it.'} /></section>}
      <section className="container detail-section"><SectionHeading eyebrow="You might also like" title="More to discover" />{related.length ? <div className="media-grid">{related.map((entry) => <MediaCard key={entry.id} item={entry} />)}</div> : <EmptyState title="No related titles" copy="Explore the catalog for more stories." />}</section>
    </div>
  );
}

export function WatchPage({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    getMediaBySlug(kind, slug).then((value) => {
      if (mounted) {
        setItem(value);
        setSourceIndex(0);
      }
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [kind, slug]);

  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-player" /></div>;
  if (error || !item) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;

  const sources = item.streamingLinks;
  const currentSource = sources[sourceIndex] || '';

  return (
    <div className="page page-watch">
      <section className="container watch-top">
        <Link className="back-link" to={`/${kind === 'movie' ? 'movies' : 'series'}/${slug}`}><ArrowLeft size={15} /> Back to details</Link>
        <div className="player-shell">
          <VideoPlayer source={currentSource} poster={item.backdrop || item.poster} title={item.title} />
        </div>
        {sources.length > 1 && <div className="player-sources" aria-label="Video sources">{sources.map((_, index) => <button key={index} className={index === sourceIndex ? 'player-source player-source--active' : 'player-source'} onClick={() => setSourceIndex(index)}>Source {index + 1}</button>)}</div>}
        <div className="watch-heading">
          <div><span className="eyebrow">Now watching</span><h1>{item.title}</h1></div>
          <DownloadAction links={item.downloadLinks} title={item.title} />
        </div>
      </section>
      <section className="container watch-lower"><div className="watch-note"><Users size={18} /><div><b>Make it a Yangon TV night.</b><p>{sources.length ? 'Choose the video controls above to start playback.' : 'Playback will appear when the backend provides a streaming URL.'}</p></div></div></section>
    </div>
  );
}
