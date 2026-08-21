import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Children, type ReactNode } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Search, Star } from 'lucide-react';
import type { MediaItem } from '../../lib/types';
import { mediaUrl } from '../../lib/api';
import { mediaDetailPath } from '../../lib/paths';

export function Logo() {
  return <Link className="brand" to="/" aria-label="Yangon TV home"><span>YANGON</span><b>TV</b></Link>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { label: string; to: string } }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow || 'Yangon TV picks'}</span><h2>{title}</h2></div>{action && <Link className="text-link" to={action.to}>{action.label}<ArrowRight size={15} /></Link>}</div>;
}

export function MediaCard({ item, compact = false }: { item: MediaItem; compact?: boolean }) {
  return <Link to={mediaDetailPath(item)} className={`media-card ${compact ? 'media-card--compact' : ''}`}>
    <div className="poster-wrap">
      <img src={mediaUrl(item.poster, item.poster)} alt={`${item.title} poster`} loading="lazy" />
      <div className="poster-gradient" />
      {item.badge && <span className="media-badge">{item.badge}</span>}
      <span className="poster-play"><Play size={16} fill="currentColor" /></span>
      <span className="card-rating"><Star size={12} fill="currentColor" /> {item.rating.toFixed(1)}</span>
    </div>
    <div className="media-card__body"><h3>{item.title}</h3><div className="media-meta"><span>{item.year}</span><i /> <span>{item.kind === 'series' ? `${item.seasonCount ?? item.seasons?.length ?? 0} seasons` : item.runtime}</span></div></div>
  </Link>;
}

export function SearchField({ value, onChange, onSubmit, placeholder = 'Search titles, genres, stories...' }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder?: string }) {
  return <form className="search-field" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><Search size={18} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /><button type="submit">Search</button></form>;
}

export function Pill({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  const Component = onClick ? 'button' : 'span';
  return <Component className={`pill ${active ? 'pill--active' : ''}`} onClick={onClick}>{children}</Component>;
}

export function Pagination({ page, lastPage, onChange }: { page: number; lastPage: number; onChange: (page: number) => void }) {
  if (lastPage <= 1) return null;
  return <div className="pagination"><button className="icon-button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button><span>Page <b>{page}</b> of {lastPage}</span><button className="icon-button" disabled={page >= lastPage} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div>;
}

export function EmptyState({ title = 'Nothing here yet', copy = 'Try another search or check back soon.' }: { title?: string; copy?: string }) {
  return <div className="state-card"><div className="state-icon">✦</div><h3>{title}</h3><p>{copy}</p></div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="state-card"><div className="state-icon state-icon--danger">!</div><h3>We hit a small bump</h3><p>The content could not be loaded right now. Please try again.</p>{onRetry && <button className="button button--outline" onClick={onRetry}>Try again</button>}</div>;
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return <div className="media-grid">{Array.from({ length: count }).map((_, index) => <div className="skeleton-card" key={index}><div className="skeleton skeleton-poster" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line skeleton-line--short" /></div>)}</div>;
}

export function AutoSlider({ eyebrow, title, action, children, className = '', interval = 4200, autoPlay = true, hideHeadingText = false }: { eyebrow?: string; title: string; action?: { label: string; to: string }; children: ReactNode; className?: string; interval?: number; autoPlay?: boolean; hideHeadingText?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const items = Children.toArray(children);

  const move = (direction: 'next' | 'previous') => {
    const track = trackRef.current;
    if (!track) return;
    const firstSlide = track.querySelector('.auto-slider__slide') as HTMLElement | null;
    const step = firstSlide ? firstSlide.getBoundingClientRect().width + 21 : track.clientWidth * 0.86;
    const nextLeft = direction === 'next' ? track.scrollLeft + step : track.scrollLeft - step;
    const maxLeft = track.scrollWidth - track.clientWidth;
    const target = direction === 'next' && nextLeft >= maxLeft - 2 ? 0 : direction === 'previous' && nextLeft <= 2 ? maxLeft : nextLeft;
    track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!autoPlay || paused || pageHidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches || items.length < 2) return;
    const timer = window.setInterval(() => move('next'), interval);
    return () => window.clearInterval(timer);
  }, [autoPlay, paused, pageHidden, interval, items.length]);

  useEffect(() => {
    const onVisibilityChange = () => setPageHidden(document.hidden);
    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return <section className={`auto-slider ${className}`} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
    <div className="auto-slider__heading">{hideHeadingText ? <div className="auto-slider__action-only">{action && <Link className="text-link" to={action.to}>{action.label}<ArrowRight size={15} /></Link>}</div> : <SectionHeading eyebrow={eyebrow} title={title} action={action} />}<div className="auto-slider__controls"><button className="icon-button" type="button" onClick={() => move('previous')} aria-label={`Previous ${title.toLowerCase()}`}><ChevronLeft size={18} /></button><button className="icon-button" type="button" onClick={() => move('next')} aria-label={`Next ${title.toLowerCase()}`}><ChevronRight size={18} /></button></div></div>
    <div className="auto-slider__viewport" ref={trackRef} role="region" aria-roledescription="carousel" aria-label={title} tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowLeft') move('previous'); if (event.key === 'ArrowRight') move('next'); }}><div className="auto-slider__track">{items.map((content, index) => <div className="auto-slider__slide" key={index}>{content}</div>)}</div></div>
    <span className="auto-slider__status" aria-live="polite">{autoPlay && !pageHidden ? (paused ? 'Paused' : 'Auto-scrolling') : 'Manual scrolling'}</span>
  </section>;
}
