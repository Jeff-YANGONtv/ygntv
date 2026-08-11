import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Search, Star } from 'lucide-react';
import type { MediaItem } from '../../lib/types';
import { mediaUrl } from '../../lib/api';

export function Logo() {
  return <Link className="brand" to="/" aria-label="Yangon TV home"><span>YANGON</span><b>TV</b></Link>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { label: string; to: string } }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow || 'Yangon TV picks'}</span><h2>{title}</h2></div>{action && <Link className="text-link" to={action.to}>{action.label}<ArrowRight size={15} /></Link>}</div>;
}

export function MediaCard({ item, compact = false }: { item: MediaItem; compact?: boolean }) {
  return <Link to={`/${item.kind === 'movie' ? 'movies' : 'series'}/${item.slug}`} className={`media-card ${compact ? 'media-card--compact' : ''}`}>
    <div className="poster-wrap">
      <img src={mediaUrl(item.poster, item.poster)} alt={`${item.title} poster`} loading="lazy" />
      <div className="poster-gradient" />
      {item.badge && <span className="media-badge">{item.badge}</span>}
      <span className="poster-play"><Play size={16} fill="currentColor" /></span>
      <span className="card-rating"><Star size={12} fill="currentColor" /> {item.rating.toFixed(1)}</span>
    </div>
    <div className="media-card__body"><h3>{item.title}</h3><div className="media-meta"><span>{item.year}</span><i /> <span>{item.kind === 'series' ? `${item.seasons} seasons` : item.runtime}</span></div></div>
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
