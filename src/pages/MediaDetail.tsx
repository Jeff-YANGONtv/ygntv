import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CalendarDays, ChevronDown, Download, Expand, KeyRound, Maximize, Pause, Play, RotateCcw, RotateCw, Send, Settings2, Star, Tags, Users, Volume2, VolumeX, WalletCards } from 'lucide-react';
import Hls from 'hls.js';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { MediaCard, Pill, SectionHeading, EmptyState, ErrorState } from '../components/ui/Primitives';
import { getMediaBySlug, getMovies, getSeries, getTvPlayback, mediaUrl, purchasePrepaidUnlock, saveTvViewingProgress } from '../lib/api';
import { mediaDetailPath, mediaWatchPath, publicMediaSlug } from '../lib/paths';
import type { MediaItem, TvPlaybackAccess, TvPlaybackPayload, TvPlaybackSource } from '../lib/types';
import '../styles/prepaid-access.css';

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

function VideoPlayer({ source, playbackSource, poster, title, historyContentType, historyContentId }: { source: string; playbackSource?: TvPlaybackSource; poster?: string; title: string; historyContentType?: 'movie' | 'episode'; historyContentId?: number }) {
const videoRef = useRef<HTMLVideoElement>(null);
const playerRef = useRef<HTMLDivElement>(null);
  const [playerError, setPlayerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
const [controlsVisible, setControlsVisible] = useState(true);
const [speedOpen, setSpeedOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [qualityOptions, setQualityOptions] = useState<Array<{ value: number; label: 'Auto' | 'SD' | 'HD' }>>([{ value: -1, label: 'Auto' }]);
  const [qualityLevel, setQualityLevel] = useState(-1);
const hideControlsTimer = useRef<number | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSavedPosition = useRef(0);
const sourceUrl = mediaUrl(source);
  const embedUrl = playbackSource?.mode === 'custom_embed' ? playbackSource.embed_url : providerEmbedUrl(sourceUrl);
  const resolvedSource = directMediaUrl(sourceUrl);
  const resolvedPoster = poster ? mediaUrl(poster) : undefined;
  const provider = providerLabel(sourceUrl);
  const isUnsupportedWatchPage = /\/watch(?:\/|$)/i.test(resolvedSource);
  const isHls = /\.m3u8(?:$|[?#])/i.test(resolvedSource);

const clearHideControlsTimer = () => {
if (hideControlsTimer.current !== null) window.clearTimeout(hideControlsTimer.current);
hideControlsTimer.current = null;
};

  const saveProgress = (completed = false) => {
    const video = videoRef.current;
    if (!video || !historyContentType || !historyContentId) return;
    const position = Math.max(0, Math.floor(video.currentTime || 0));
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? Math.floor(video.duration) : undefined;
    if (!completed && position < 1) return;
    lastSavedPosition.current = position;
    void saveTvViewingProgress({ content_type: historyContentType, content_id: historyContentId, position_seconds: position, ...(duration ? { duration_seconds: duration } : {}), completed }).catch(() => undefined);
  };

const revealControls = () => {
    clearHideControlsTimer();
    setControlsVisible(true);
    if (isPlaying) hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 2800);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const total = Math.floor(value);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (isUnsupportedWatchPage || !video || !resolvedSource) return;
    let hls: Hls | null = null;
    let timeoutId = 0;
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
    setIsPlaying(false);
    setCurrentTime(0);
	setDuration(0);
	setSpeedOpen(false);
	setQualityOpen(false);
	setQualityLevel(-1);
	setQualityOptions([{ value: -1, label: 'Auto' }]);
	setControlsVisible(true);
    lastSavedPosition.current = 0;
timeoutId = window.setTimeout(() => {
      setIsLoading(false);
      setPlayerError('The streaming server did not send video data. Please add a new direct MP4 or HLS URL.');
    }, 15000);
    video.addEventListener('loadedmetadata', markLoaded);
    video.addEventListener('canplay', markLoaded);
    video.addEventListener('error', showError);

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false });
	  hlsRef.current = hls;
      hls.loadSource(resolvedSource);
      hls.attachMedia(video);
	  hls.on(Hls.Events.MANIFEST_PARSED, () => {
		const levels = hls?.levels ?? [];
		const options = levels.reduce<Array<{ value: number; label: 'SD' | 'HD' }>>((items, level, index) => {
		  const label: 'SD' | 'HD' = level.height <= 480 ? 'SD' : 'HD';
		  return items.some((item) => item.label === label) ? items : [...items, { value: index, label }];
		}, []);
		setQualityOptions([{ value: -1, label: 'Auto' }, ...options]);
	  });
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
	  hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [isUnsupportedWatchPage, resolvedSource]);

  useEffect(() => {
const video = videoRef.current;
const player = playerRef.current;
if (!video || !player || isUnsupportedWatchPage || embedUrl) return;
    const onTimeUpdate = () => {
      const position = video.currentTime || 0;
      setCurrentTime(position);
      if (position - lastSavedPosition.current >= 30) saveProgress(false);
    };
const onDurationChange = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
const onPlay = () => { setIsPlaying(true); revealControls(); };
    const onPause = () => { setIsPlaying(false); setControlsVisible(true); clearHideControlsTimer(); saveProgress(false); };
    const onEnded = () => { setIsPlaying(false); setControlsVisible(true); clearHideControlsTimer(); saveProgress(true); };
const onVolumeChange = () => { setVolume(video.volume); setIsMuted(video.muted || video.volume === 0); };
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === player);
    video.addEventListener('timeupdate', onTimeUpdate);
video.addEventListener('durationchange', onDurationChange);
video.addEventListener('play', onPlay);
video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
video.addEventListener('volumechange', onVolumeChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      clearHideControlsTimer();
      video.removeEventListener('timeupdate', onTimeUpdate);
video.removeEventListener('durationchange', onDurationChange);
video.removeEventListener('play', onPlay);
video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
video.removeEventListener('volumechange', onVolumeChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [embedUrl, historyContentId, historyContentType, isUnsupportedWatchPage, resolvedSource]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) await video.play();
      else video.pause();
    } catch {
      setPlayerError('Playback could not start. Please try again or use another source.');
    }
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration);
    revealControls();
  };

  const setProgress = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = value;
    setCurrentTime(value);
    revealControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.65;
    revealControls();
  };

  const setPlayerVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const setPlaybackSpeed = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = value;
    setSpeedOpen(false);
    revealControls();
  };

  const setPlaybackQuality = (value: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = value;
    setQualityLevel(value);
    setQualityOpen(false);
    revealControls();
  };

  const toggleFullscreen = async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await player.requestFullscreen();
    } catch {
      setPlayerError('Fullscreen is not available in this browser.');
    }
  };

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
    <div ref={playerRef} className="player-frame player-frame--custom" onMouseMove={revealControls} onMouseLeave={() => { if (isPlaying) hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 700); }}>
      <video ref={videoRef} className="video-player" playsInline preload="metadata" poster={resolvedPoster} aria-label={`Play ${title}`} onClick={togglePlay} />
      <div className={controlsVisible || !isPlaying ? 'player-custom__shade player-custom__shade--visible' : 'player-custom__shade'}>
        <div className="player-custom__top"><span className="player-custom__brand">YANGON <b>TV</b></span><span className="player-custom__source">{isHls ? 'HLS STREAM' : 'DIRECT STREAM'}</span></div>
        <button className="player-custom__center-play" type="button" aria-label={isPlaying ? 'Pause video' : 'Play video'} onClick={togglePlay}>{isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={30} fill="currentColor" />}</button>
        <div className="player-custom__dock">
          <input className="player-custom__progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => setProgress(Number(event.target.value))} aria-label="Video progress" />
          <div className="player-custom__controls">
            <button type="button" className="player-custom__icon" onClick={togglePlay} aria-label={isPlaying ? 'Pause video' : 'Play video'}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <button type="button" className="player-custom__icon" onClick={() => seekBy(-10)} aria-label="Rewind 10 seconds"><RotateCcw size={18} /><span>10</span></button>
            <button type="button" className="player-custom__icon" onClick={() => seekBy(10)} aria-label="Forward 10 seconds"><RotateCw size={18} /><span>10</span></button>
            <span className="player-custom__time">{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span>
            <div className="player-custom__volume"><button type="button" className="player-custom__icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(event) => setPlayerVolume(Number(event.target.value))} aria-label="Volume" /></div>
            {isHls && qualityOptions.length > 1 && <div className="player-custom__quality"><button type="button" className="player-custom__icon player-custom__speed-toggle" onClick={() => { setQualityOpen((value) => !value); setSpeedOpen(false); }} aria-label="Video quality"><Settings2 size={17} /><span>{qualityOptions.find((option) => option.value === qualityLevel)?.label || 'Auto'}</span></button>{qualityOpen && <div className="player-custom__speed-menu" role="menu">{qualityOptions.map((option) => <button type="button" key={option.value} onClick={() => setPlaybackQuality(option.value)}>{option.label}</button>)}</div>}</div>}
            <div className="player-custom__speed"><button type="button" className="player-custom__icon player-custom__speed-toggle" onClick={() => { setSpeedOpen((value) => !value); setQualityOpen(false); }} aria-label="Playback speed"><Settings2 size={17} /><span>Speed</span></button>{speedOpen && <div className="player-custom__speed-menu" role="menu">{[1.5, 2, 2.5, 3].map((speed) => <button type="button" key={speed} onClick={() => setPlaybackSpeed(speed)}>{speed}×</button>)}</div>}</div>
            <button type="button" className="player-custom__icon" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>{isFullscreen ? <Expand size={18} /> : <Maximize size={18} />}</button>
          </div>
        </div>
      </div>
      {isLoading && <div className="player-custom__loading" aria-live="polite"><span /><b>Connecting to Yangon TV stream…</b></div>}
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
                        to={mediaWatchPath(item, { season: season.number, episode: episode.number })}
                        onClick={(event) => {
                          if (!user) {
                            event.preventDefault();
                            openAuth('login', mediaWatchPath(item, { season: season.number, episode: episode.number }));
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

type ReviewTab = 'review' | 'watch' | 'download';

function ReviewTabs({
  item,
  kind,
  onDirectAction,
}: {
  item: MediaItem;
  kind: 'movie' | 'series';
  onDirectAction: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ReviewTab>('review');
  const telegramPostUrl = item.telegramPostUrl;
  const title = kind === 'movie' ? 'movie' : 'series';
  const directLabel = activeTab === 'watch' ? 'Direct Watch' : 'Direct Download';
  const telegramLabel = activeTab === 'watch' ? 'Watch Via Telegram' : 'Download Via Telegram';

  return (
    <section className="review-tabs" aria-label={`${item.title} review actions`}>
      <div className="review-tabs__list" role="tablist" aria-label="Review sections">
        {([
          ['review', 'Review'],
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

      {activeTab === 'review' ? (
        <div className="review-tabs__panel" id="review-panel-review" role="tabpanel">
          <span className="eyebrow">Review</span>
          <p>{item.synopsis || item.description || 'No review is available for this title yet.'}</p>
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
      <p className="review-tabs__note">{activeTab === 'review' ? `Browse this ${title} publicly. Direct Watch and Direct Download require a Yangon TV account.` : 'Direct actions continue to the protected Yangon TV player.'}</p>
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
      if (value && slug !== publicMediaSlug(value.slug)) navigate(mediaDetailPath(value), { replace: true });
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [kind, navigate, slug]);

  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-detail" /></div>;
    if (error || !item) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;
  const startWatching = (path: string) => {
    if (user) navigate(path);
    else openAuth('login', path);
  };
  const firstEpisode = kind === 'series' ? [...(item.seasons?.[0]?.episodes ?? [])].sort((left, right) => left.number - right.number)[0] : undefined;
  const firstSeason = item.seasons?.[0];
  const watchPath = firstEpisode && firstSeason
    ? mediaWatchPath(item, { season: firstSeason.number, episode: firstEpisode.number })
    : mediaWatchPath(item);

  return (
    <div className="page page-detail">
      <section className="detail-hero">
        <img src={mediaUrl(item.backdrop, item.poster)} alt="" />
        <div className="detail-shade" />
        <div className="container detail-hero-content">
          <Link className="back-link detail-back-button" to={kind === 'movie' ? '/movies' : '/series'} aria-label={kind === 'movie' ? 'Back to Movies' : 'Back to Series'}><ArrowLeft size={16} /> <span>Back</span></Link>
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
              {kind === 'movie' && <p className="detail-production-credit"><span>Translated &amp; Encoded by</span> <strong>YGNTV – Production Unit</strong></p>}
              <ReviewTabs
                item={item}
                kind={kind}
                onDirectAction={() => startWatching(kind === 'movie' ? mediaWatchPath(item) : watchPath)}
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
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedSeasonNumber = Number(searchParams.get('season'));
  const selectedEpisodeNumber = Number(searchParams.get('episode'));
  const [item, setItem] = useState<MediaItem | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playback, setPlayback] = useState<TvPlaybackPayload | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState('');
  const [purchaseOffer, setPurchaseOffer] = useState<TvPlaybackAccess | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const selectedEpisode = useMemo(() => kind === 'series'
    ? item?.seasons?.flatMap((season) => season.episodes.map((episode) => ({ season, episode }))).find(({ season, episode }) => season.number === selectedSeasonNumber && episode.number === selectedEpisodeNumber)?.episode
    : undefined, [item, kind, selectedEpisodeNumber, selectedSeasonNumber]);
  const historyContentType = selectedEpisode ? 'episode' : 'movie';
  const historyContentId = Number(selectedEpisode?.id ?? item?.id);

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
        if (value && slug !== publicMediaSlug(value.slug)) navigate(mediaWatchPath(value, { season: selectedSeasonNumber, episode: selectedEpisodeNumber }), { replace: true });
      }
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [kind, navigate, selectedEpisodeNumber, selectedSeasonNumber, slug]);

  useEffect(() => {
    if (loading || !item || !user) return;
    if (kind === 'series' && !selectedEpisode) {
      setPlaybackError('Choose a series episode to begin playback.');
      return;
    }
    let mounted = true;
    if (!Number.isFinite(historyContentId) || historyContentId < 1) {
      setPlaybackError('This title is not ready for protected playback.');
      return;
    }
    setPlaybackLoading(true);
    setPlaybackError('');
    setPlayback(null);
    setPurchaseOffer(null);
    setSourceIndex(0);
    getTvPlayback(historyContentType, historyContentId).then((value) => {
      if (mounted) setPlayback(value);
    }).catch((cause) => {
      if (!mounted) return;
      const response = (cause as { response?: { status?: number; data?: { data?: unknown; message?: string } } })?.response;
      const offer = response?.data?.data as TvPlaybackAccess | undefined;
      if (response?.status === 402 && offer?.access === 'purchase_required') {
        setPurchaseOffer(offer);
      } else {
        setPlaybackError(response?.data?.message || 'Playback access is temporarily unavailable. Please try again.');
      }
    }).finally(() => {
      if (mounted) setPlaybackLoading(false);
    });
    return () => { mounted = false; };
  }, [historyContentId, historyContentType, item, kind, loading, selectedEpisode, user]);

  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-player" /></div>;
  if (error || !item) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;

  const sources = playback?.streaming_links ?? [];
  const downloadLinks = playback?.download_links ?? [];
  const currentSource = sources[sourceIndex] || '';
  const resolvedPlaybackSource = playback?.playback?.mode === 'custom_embed'
    ? playback.playback.embed_url
    : playback?.playback?.mode === 'bunny_hls'
      ? playback.playback.hls_url
      : currentSource;
  const currentTitle = playback?.title || (selectedEpisode ? `${item.title} — ${selectedEpisode.title}` : item.title);

  async function confirmPrepaidPurchase() {
    if (!purchaseOffer || purchasing) return;
    setPurchasing(true);
    setPlaybackError('');
    try {
      await purchasePrepaidUnlock(purchaseOffer.content_type, purchaseOffer.content_id);
      const protectedPlayback = await getTvPlayback(purchaseOffer.content_type, purchaseOffer.content_id);
      setPlayback(protectedPlayback);
      setPurchaseOffer(null);
      setSourceIndex(0);
    } catch (cause) {
      const response = (cause as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
      const fieldError = response?.data?.errors ? Object.values(response.data.errors).flat()[0] : undefined;
      setPlaybackError(fieldError || response?.data?.message || 'Unable to unlock this title. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div className="page page-watch">
      <section className="container watch-top">
        <Link className="back-link watch-back-link" to={mediaDetailPath(item)}><ArrowLeft size={16} /> <span>Back to details</span></Link>
        <div className="player-shell">
          {playbackLoading ? <div className="player-placeholder player-empty"><div className="player-play"><Play size={26} fill="currentColor" /></div><span>Checking playback access…</span><small>Yangon TV is confirming your viewing entitlement.</small></div> : purchaseOffer ? <div className="prepaid-unlock-card"><div className="prepaid-unlock-card__icon"><WalletCards size={26} /></div><span className="eyebrow">Pay with Points</span><h2>Unlock {purchaseOffer.title}</h2><p>This {purchaseOffer.content_type === 'movie' ? 'movie' : 'episode'} costs <strong>{purchaseOffer.price_points} Points</strong>. Your current balance is <strong>{purchaseOffer.balance_points ?? 0} Points</strong>.</p><p className="prepaid-unlock-card__term">After purchase, you can watch it again for 3 months.</p><button className="button button--primary" type="button" onClick={confirmPrepaidPurchase} disabled={purchasing || (purchaseOffer.balance_points ?? 0) < purchaseOffer.price_points}><KeyRound size={17} />{purchasing ? 'Unlocking…' : `Unlock for ${purchaseOffer.price_points} Points`}</button>{(purchaseOffer.balance_points ?? 0) < purchaseOffer.price_points && <small><AlertCircle size={14} /> Your Point balance is not enough. Redeem a prepaid code from Subscription.</small>}</div> : <VideoPlayer source={resolvedPlaybackSource} playbackSource={playback?.playback} poster={selectedEpisode?.thumbnail || item.backdrop || item.poster} title={currentTitle} historyContentType={user ? historyContentType : undefined} historyContentId={user && Number.isFinite(historyContentId) ? historyContentId : undefined} />}
        </div>
        {sources.length > 1 && <div className="player-sources" aria-label="Video sources">{sources.map((_, index) => <button key={index} className={index === sourceIndex ? 'player-source player-source--active' : 'player-source'} onClick={() => setSourceIndex(index)}>Source {index + 1}</button>)}</div>}
        <div className="watch-heading">
          <div><span className="eyebrow">Now watching</span><h1>{currentTitle}</h1></div>
          {playback?.access.access === 'premium' ? <DownloadAction links={downloadLinks} title={currentTitle} canDownload={Boolean(user)} onRequireAuth={() => openAuth('login', `${window.location.pathname}${window.location.search}`)} /> : <span className="watch-premium-download">{playback ? 'Downloads are included with Premium membership.' : ''}</span>}
        </div>
      </section>
      <section className="container watch-lower"><div className="watch-note"><Users size={18} /><div><b>{playback?.access.access === 'premium' ? 'Premium access active.' : playback?.access.access === 'prepaid_unlock' ? 'This title is unlocked for your account.' : 'Make it a Yangon TV night.'}</b><p>{playbackError || (resolvedPlaybackSource ? 'Choose the video controls above to start playback.' : purchaseOffer ? 'Confirm the Point unlock to start playback.' : 'Playback will appear when the backend provides a streaming URL.')}</p></div></div></section>
    </div>
  );
}
