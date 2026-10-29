import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AutoSlider, EmptyState, ErrorState, MediaCard, SkeletonGrid } from '../components/ui/Primitives';
import { useAuth } from '../lib/auth';
import { getAds, getBlogs, getMovies, getSeries, mediaUrl } from '../lib/api';
import { blogPath, mediaDetailPath, mediaWatchPath } from '../lib/paths';
import type { AdBanner, BlogPost, MediaItem } from '../lib/types';
import '../styles/streaming-home.css';

export function Home() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [headerAds, setHeaderAds] = useState<AdBanner[]>([]);
  const [footerAds, setFooterAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();

  const loadHome = () => {
    setLoading(true);
    setError(false);
    Promise.all([getMovies({ page: 1 }), getSeries({ page: 1 }), getBlogs({ page: 1 }), getAds('home_header'), getAds('home_footer')])
      .then(([moviePage, seriesPage, blogPage, headerBanners, footerBanners]) => {
        setMovies(moviePage.data);
        setSeries(seriesPage.data);
        setBlogs(blogPage.data);
        setHeaderAds(headerBanners.filter((ad) => ad.type === 'banner' && Boolean(ad.content)));
        setFooterAds(footerBanners.filter((ad) => ad.type === 'banner' && Boolean(ad.content)));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHome(); }, []);

  const featured = useMemo(
    () => [...movies, ...series].find((item) => Boolean(item.backdrop || item.poster)) || movies[0] || series[0],
    [movies, series],
  );
  const hasContent = Boolean(movies.length || series.length || blogs.length || headerAds.length || footerAds.length);

  const watch = (item: MediaItem) => {
    const path = mediaWatchPath(item);
    if (user) navigate(path);
    else openAuth('login', path);
  };

  if (loading) return <div className="page page-loading container"><SkeletonGrid count={6} /></div>;
  if (error) return <div className="page page-state container"><ErrorState onRetry={loadHome} /></div>;
  if (!hasContent) return <div className="page page-state container"><EmptyState title="No content available" copy="The backend has not published any banners, movies, or series yet." /></div>;

  return <div className="page page-home page-home--streaming">
    {featured && <FeaturedHero item={featured} onWatch={() => watch(featured)} />}
    <div className={`stream-home__catalog ${featured ? 'stream-home__catalog--with-hero' : ''}`}>
      {headerAds.length > 0 && <AutoSlider className="container stream-home__rail stream-home__partner-rail" eyebrow="Partner spotlight" title="From our partners" autoPlay={false}>{headerAds.map((ad) => <AdBanner ad={ad} key={ad.id} />)}</AutoSlider>}
      {movies.length > 0 && <AutoSlider className="container stream-home__rail" eyebrow="Find your next story" title="Movies to discover" action={{ label: 'Explore movies', to: '/movies' }} autoPlay={false}>{movies.slice(0, 12).map((item) => <MediaCard item={item} key={item.id} />)}</AutoSlider>}
      {series.length > 0 && <AutoSlider className="container stream-home__rail" eyebrow="One more episode" title="Series to binge" action={{ label: 'Explore series', to: '/series' }} autoPlay={false}>{series.slice(0, 12).map((item) => <MediaCard item={item} key={item.id} />)}</AutoSlider>}
      {blogs.length > 0 && <AutoSlider className="container stream-home__rail stream-home__stories" eyebrow="Behind the stories" title="Recaps & reads" action={{ label: 'Visit the blog', to: '/blog' }} autoPlay={false}>{blogs.slice(0, 12).map((post) => <StoryCard post={post} key={post.id} />)}</AutoSlider>}
      {footerAds.length > 0 && <AutoSlider className="container stream-home__rail stream-home__partner-rail stream-home__partner-rail--footer" eyebrow="More from our partners" title="Partner spotlights" autoPlay={false}>{footerAds.map((ad) => <AdBanner ad={ad} key={ad.id} />)}</AutoSlider>}
    </div>
  </div>;
}

function FeaturedHero({ item, onWatch }: { item: MediaItem; onWatch: () => void }) {
  const seasonCount = item.seasonCount ?? item.seasons?.length ?? 0;
  const detailPath = mediaDetailPath(item);
  const image = mediaUrl(item.backdrop || item.poster);

  return <section className="stream-home__hero" aria-label={`Featured ${item.kind}`}>
    {image && <img className="stream-home__hero-image" src={image} alt="" loading="eager" decoding="async" fetchPriority="high" width="1920" height="1080" />}
    <div className="stream-home__hero-shade" aria-hidden="true" />
    <div className="container stream-home__hero-inner">
      <div className="stream-home__hero-copy">
        <span className="stream-home__eyebrow"><Sparkles size={14} /> Yangon TV spotlight</span>
        <span className="stream-home__hero-type">Featured {item.kind}</span>
        <h1>{item.title}</h1>
        <div className="stream-home__hero-meta">
          {item.rating > 0 && <span className="stream-home__rating"><Star size={14} fill="currentColor" /> {item.rating.toFixed(1)}</span>}
          {item.year && <span>{item.year}</span>}
          <span>{item.kind === 'series' ? 'Series' : 'Movie'}</span>
          {item.kind === 'series' && seasonCount > 0 && <span>{seasonCount} {seasonCount === 1 ? 'season' : 'seasons'}</span>}
          {item.kind === 'movie' && item.runtime && <span>{item.runtime}</span>}
        </div>
        {item.genres.length > 0 && <div className="stream-home__genres">{item.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div>}
        <p className="stream-home__hero-summary">{item.synopsis || item.description}</p>
        <div className="stream-home__hero-actions">
          <button className="button button--primary" type="button" onClick={onWatch}><Play size={17} fill="currentColor" /> Watch now</button>
          <Link className="button button--glass" to={detailPath}>More info <ArrowRight size={16} /></Link>
        </div>
      </div>
      <span className="stream-home__hero-index" aria-hidden="true">YANGON TV <i /> FEATURED</span>
    </div>
  </section>;
}

function StoryCard({ post }: { post: BlogPost }) {
  return <Link className="stream-home__story" to={blogPath(post)}>
    <div className="stream-home__story-image"><img src={mediaUrl(post.cover || post.image)} alt={post.cover_alt || post.title} loading="lazy" decoding="async" width="1280" height="720" /></div>
    <div className="stream-home__story-copy">
      <span>{post.topic || post.category} <i /> {post.readTime}</span>
      <h3>{post.title}</h3>
      <small>Read story <ArrowRight size={13} /></small>
    </div>
  </Link>;
}

function AdBanner({ ad }: { ad: AdBanner }) {
  const image = <img src={mediaUrl(ad.content)} alt={ad.name} loading="lazy" decoding="async" width="1280" height="360" />;
  return ad.link_url
    ? <a className="stream-home__ad" href={ad.link_url} target="_blank" rel="noopener noreferrer">{image}</a>
    : <div className="stream-home__ad">{image}</div>;
}
