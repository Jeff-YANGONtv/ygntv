import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronDown, Download, Play, Send, Star, Tags, Users } from 'lucide-react';
import Hls from 'hls.js';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { MediaCard, Pill, SectionHeading, EmptyState, ErrorState } from '../components/ui/Primitives';
import { getMediaBySlug, getMovies, getSeries, mediaUrl } from '../lib/api';
import type { MediaItem } from '../lib/types';

function safeFilename(title: string): string {
  return `${title.replace(/[^a-z0-9ก-๙\u1000-\u109f]+/gi, '-').replace(/^-|-$/g, '') || 'yangon-tv-video'}.mp4`;
}

function DownloadAction({ links, title, canDownload = true, onRequireAuth }: { links: string[]; title: string; canDownload?: boolean; onRequireAuth?: () => void }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    const source = links[0];
    if (!canDownload) {
      onRequireAuth?.();
      return;
    }
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

function youtubeVideoId(value: string): string | null {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let id = '';
    if (hostname === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0] || '';
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com') {
      id = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/i)?.[1] || '';
    }
    return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function providerLabel(value: string): string | null {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'youtu.be' || hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com') return 'YouTube';
    if (hostname === 'nstream.cc') return 'nstream.cc';
    if (hostname === 'drive.google.com' || hostname === 'docs.google.com') return 'Google Drive';
    if (hostname === 'mega.nz' || hostname.endsWith('.mega.nz')) return 'MEGA';
    if (hostname === 'terabox.com' || hostname.endsWith('.terabox.com') || hostname === 'teraboxapp.com' || hostname.endsWith('.teraboxapp.com') || hostname === '1024terabox.com' || hostname.endsWith('.1024terabox.com')) return 'TeraBox';
    if (hostname === 'megaup.net' || hostname.endsWith('.megaup.net') || hostname === 'megaup.cc' || hostname.endsWith('.megaup.cc')) return 'MegaUp';
  } catch {
    // Invalid URLs are handled by the regular player error state.
  }
  return null;
}

function providerEmbedUrl(value: string): string | null {
  const youtubeId = youtubeVideoId(value);
  if (youtubeId) return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`;
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'drive.google.com' || hostname === 'docs.google.com') {
      const id = parsed.pathname.match(/\/file\/d\/([^/]+)/i)?.[1] || parsed.searchParams.get('id') || '';
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
    if (!/(^|\.)nstream\.cc$/i.test(parsed.hostname)) return null;
    const match = parsed.pathname.match(/^\/(?:v|e)\/([^/]+)\/?$/i);
    return match ? `https://nstream.cc/e/${match[1]}` : null;
  } catch {
    return null;
  }
}

function VideoPlayer({ source, poster, title }: { source: string; poster?: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerError, setPlayerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sourceUrl = mediaUrl(source);
  const embedUrl = providerEmbedUrl(sourceUrl);
  const resolvedSource = directMediaUrl(sourceUrl);
  const resolvedPoster = poster ? mediaUrl(poster) : undefined;
  const provider = providerLabel(sourceUrl);
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

  if (embedUrl) {
    return (
      <div className="player-frame player-frame--embed">
        <iframe
          className="video-embed"
          src={embedUrl}
          title={`Play ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (isUnsupportedWatchPage || (provider && !embedUrl)) {
    return (
      <div className="player-placeholder player-empty">
        <div className="player-play"><Play size={26} fill="currentColor" /></div>
        <span>{provider ? `${provider} link` : 'Unsupported watch-page link'}</span>
        <small>{provider ? `${provider} does not expose a universal browser player. Open the provider page to watch or download it.` : 'Please save a direct MP4 or HLS (.m3u8) streaming URL in the admin panel.'}</small>
        <a className="button button--outline" href={resolvedSource} target="_blank" rel="noreferrer">Open {provider || 'source'}</a>
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

function SeriesEpisodes({ item }: { item: MediaItem }) {
  const { user, openAuth } = useAuth();
  const seasons = [...(item.seasons ?? [])].sort((left, right) => left.number - right.number);
  const [openSeasons, setOpenSeasons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenSeasons(Object.fromEntries(seasons.map((season) => [String(season.id), true])));
  }, [item.id]);

  if (!seasons.length) {
    return <EmptyState title="No seasons available" copy="Season and episode information will appear when the backend provides it." />;
  }

  return (
    <div className="season-list">
      {seasons.map((season) => {
        const key = String(season.id);
        const episodes = [...season.episodes].sort((left, right) => left.number - right.number);
        const isOpen = openSeasons[key] ?? true;
        return (
          <div className="season" key={key}>
            <button
              className="season-heading"
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenSeasons((current) => ({ ...current, [key]: !isOpen }))}
            >
              <span><b>Season {season.number}</b><strong>{season.title}</strong></span>
              <span>{episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'} <ChevronDown size={16} /></span>
            </button>
            {isOpen && (
              <div className="season-content">
                {season.review && <p className="season-review">{season.review}</p>}
                {season.year && <span className="season-year">{season.year}</span>}
                {episodes.length ? (
                  <div className="episode-list">
                    {episodes.map((episode) => (
                      <Link
                        className="episode-row"
                        key={String(episode.id)}
                        to={`/series/${item.slug}/watch?season=${season.number}&episode=${episode.number}`}
                        onClick={(event) => {
                          if (!user) {
                            event.preventDefault();
                            openAuth('login', `/series/${item.slug}/watch?season=${season.number}&episode=${episode.number}`);
                          }
                        }}
                      >
                        <img src={mediaUrl(episode.thumbnail, item.poster)} alt="" />
                        <span className="episode-number">{String(episode.number).padStart(2, '0')}</span>
                        <span className="episode-title">
                          <b>{episode.title}</b>
                          <small>{episode.review || episode.duration || `Season ${season.number} · Episode ${episode.number}`}</small>
                        </span>
                        <Play size={16} fill="currentColor" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="season-empty">No episodes have been added to this season yet.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ReviewTab = 'synopsis' | 'watch' | 'download';

function ReviewTabs({
  item,
  kind,
  onDirectAction,
}: {
  item: MediaItem;
  kind: 'movie' | 'series';
  onDirectAction: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ReviewTab>('synopsis');
  const telegramPostUrl = item.telegramPostUrl;
  const title = kind === 'movie' ? 'movie' : 'series';
  const directLabel = activeTab === 'watch' ? 'Direct Watch' : 'Direct Download';
  const telegramLabel = activeTab === 'watch' ? 'Watch Via Telegram' : 'Download Via Telegram';

  return (
    <section className="review-tabs" aria-label={`${item.title} review actions`}>
      <div className="review-tabs__list" role="tablist" aria-label="Review sections">
        {([
          ['synopsis', 'Synopsis'],
          ['watch', 'Watch'],
          ['download', 'Download'],
        ] as const).map(([tab, label]) => (
          <button
            className={activeTab === tab ? 'review-tab review-tab--active' : 'review-tab'}
            type="button"
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`review-panel-${tab}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'synopsis' ? (
        <div className="review-tabs__panel" id="review-panel-synopsis" role="tabpanel">
          <span className="eyebrow">Synopsis</span>
          <p>{item.synopsis || item.description || 'No synopsis is available for this title yet.'}</p>
        </div>
      ) : (
        <div className="review-tabs__actions" id={`review-panel-${activeTab}`} role="tabpanel">
          <button className="review-action review-action--direct" type="button" onClick={onDirectAction}>
            <span className="review-action__mark" aria-hidden="true">YT</span>
            <span><b>{directLabel}</b><small>Open in Yangon TV player</small></span>
            {activeTab === 'watch' ? <Play size={18} fill="currentColor" /> : <Download size={18} />}
          </button>
          {telegramPostUrl ? (
            <a className="review-action review-action--telegram" href={telegramPostUrl} target="_blank" rel="noreferrer">
              <Send size={20} fill="currentColor" />
              <span><b>{telegramLabel}</b><small>Open the official channel post</small></span>
            </a>
          ) : (
            <div className="review-action review-action--unavailable" aria-disabled="true">
              <Send size={20} />
              <span><b>{telegramLabel}</b><small>The Telegram post link has not been added yet.</small></span>
            </div>
          )}
        </div>
      )}
      <p className="review-tabs__note">{activeTab === 'synopsis' ? `Browse this ${title} publicly. Direct Watch and Direct Download require a Yangon TV account.` : 'Direct actions continue to the protected Yangon TV player.'}</p>
    </section>
  );
}

export function MediaDetail({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
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
  const startWatching = (path: string) => {
    if (user) navigate(path);
    else openAuth('login', path);
  };
  const firstEpisode = kind === 'series' ? [...(item.seasons?.[0]?.episodes ?? [])].sort((left, right) => left.number - right.number)[0] : undefined;
  const firstSeason = item.seasons?.[0];
  const watchPath = firstEpisode && firstSeason
    ? `/series/${item.slug}/watch?season=${firstSeason.number}&episode=${firstEpisode.number}`
    : `/series/${item.slug}/watch`;
  return (
    <div className="page page-detail">
      <section className="detail-hero">
        <img src={mediaUrl(item.backdrop, item.poster)} alt="" />
        <div className="detail-shade" />
        <div className="container detail-hero-content">
          <button className="back-link detail-back-button" type="button" aria-label="Go back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> <span>Back</span></button>
          <div className="detail-layout">
            <img className="detail-poster" src={mediaUrl(item.poster)} alt={`${item.title} poster`} />
            <div className="detail-copy">
              <div className="pills">
                <Pill>{kind === 'movie' ? 'Movie' : 'Series'}</Pill>
                {(item.genres || []).slice(0, 2).map((genre) => <Pill key={genre}>{genre}</Pill>)}
              </div>
              <h1>{item.title}</h1>
              <div className="detail-meta">
                <span><Star size={14} fill="currentColor" /> Rating {item.rating.toFixed(1)}</span>
                <span><CalendarDays size={14} /> Release year {item.year}</span>
                <span><Tags size={14} /> {(item.genres || []).join(', ') || 'Genre unavailable'}</span>
              </div>
              <ReviewTabs
                item={item}
                kind={kind}
                onDirectAction={() => startWatching(kind === 'movie' ? `/movies/${item.slug}/watch` : watchPath)}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="container detail-section detail-extra-grid">
        <div className="detail-extra-card"><span className="eyebrow">Cast</span>{item.casts?.length ? <div className="cast-list">{item.casts.map((cast) => <span className="cast-chip" key={cast}>{cast}</span>)}</div> : <p>No cast information available.</p>}</div>
      </section>
      {kind === 'series' && <section className="container detail-section"><SectionHeading eyebrow="Season guide" title="Seasons & episodes" /><SeriesEpisodes item={item} /></section>}
      <section className="container detail-section"><SectionHeading eyebrow="You might also like" title="More to discover" />{related.length ? <div className="media-grid">{related.map((entry) => <MediaCard key={entry.id} item={entry} />)}</div> : <EmptyState title="No related titles" copy="Explore the catalog for more stories." />}</section>
    </div>
  );
}

export function WatchPage({ kind }: { kind: 'movie' | 'series' }) {
  const { slug = '' } = useParams();
  const { user, openAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedSeasonNumber = Number(searchParams.get('season'));
  const selectedEpisodeNumber = Number(searchParams.get('episode'));
  const [item, setItem] = useState<MediaItem | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !user) openAuth('login', `${window.location.pathname}${window.location.search}`);
  }, [loading, user, openAuth]);

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

  const selectedEpisode = kind === 'series'
    ? item.seasons?.flatMap((season) => season.episodes.map((episode) => ({ season, episode }))).find(({ season, episode }) => season.number === selectedSeasonNumber && episode.number === selectedEpisodeNumber)?.episode
    : undefined;
  const sources = selectedEpisode?.streamingLinks?.length ? selectedEpisode.streamingLinks : item.streamingLinks;
  const downloadLinks = selectedEpisode?.downloadLinks?.length ? selectedEpisode.downloadLinks : item.downloadLinks;
  const currentSource = sources[sourceIndex] || '';
  const currentTitle = selectedEpisode ? `${item.title} — ${selectedEpisode.title}` : item.title;

  return (
    <div className="page page-watch">
      <section className="container watch-top">
        <Link className="back-link watch-back-link" to={`/${kind === 'movie' ? 'movies' : 'series'}/${slug}`}><ArrowLeft size={16} /> <span>Back to details</span></Link>
          <div className="player-shell">
          <VideoPlayer source={currentSource} poster={selectedEpisode?.thumbnail || item.backdrop || item.poster} title={currentTitle} />
          </div>
        {sources.length > 1 && <div className="player-sources" aria-label="Video sources">{sources.map((_, index) => <button key={index} className={index === sourceIndex ? 'player-source player-source--active' : 'player-source'} onClick={() => setSourceIndex(index)}>Source {index + 1}</button>)}</div>}
        <div className="watch-heading">
          <div><span className="eyebrow">Now watching</span><h1>{currentTitle}</h1></div>
          <DownloadAction links={downloadLinks} title={currentTitle} canDownload={Boolean(user)} onRequireAuth={() => openAuth('login', `${window.location.pathname}${window.location.search}`)} />
        </div>
      </section>
      <section className="container watch-lower"><div className="watch-note"><Users size={18} /><div><b>Make it a Yangon TV night.</b><p>{sources.length ? 'Choose the video controls above to start playback.' : 'Playback will appear when the backend provides a streaming URL.'}</p></div></div></section>
    </div>
  );
}
