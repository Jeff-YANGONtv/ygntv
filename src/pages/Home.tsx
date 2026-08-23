import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { AutoSlider, EmptyState, ErrorState, SkeletonGrid } from '../components/ui/Primitives';
import { getAds, getBlogs, getMovies, getSeries, mediaUrl } from '../lib/api';
import { blogPath, mediaDetailPath, mediaWatchPath } from '../lib/paths';
import type { AdBanner, BlogPost, MediaItem } from '../lib/types';

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

  const featured = useMemo(() => [...movies, ...series].slice(0, 8), [movies, series]);
  const watch = (item: MediaItem) => {
    const path = mediaWatchPath(item);
    if (user) navigate(path);
    else openAuth('login', path);
  };

  if (loading) return <div className="page page-loading container"><SkeletonGrid count={6} /></div>;
  if (error) return <div className="page page-state container"><ErrorState onRetry={loadHome} /></div>;
  if (!featured.length && !headerAds.length && !footerAds.length) return <div className="page page-state container"><EmptyState title="No content available" copy="The backend has not published any banners, movies, or series yet." /></div>;

  return <div className="page page-home page-home--sliders">
    {headerAds.length > 0 && <AutoSlider className="container home-banner-slider home-banner-slider--header" title="Yangon TV header banners" hideHeadingText interval={5600}>{headerAds.map((ad) => <AdBannerSlide ad={ad} key={ad.id} />)}</AutoSlider>}
    {blogs.length > 0 && <AutoSlider className="container home-banner-slider" eyebrow="Latest from Yangon TV" title="Blog Post Covers" action={{ label: 'View all blogs', to: '/blog' }}>{blogs.slice(0, 8).map((post) => <BlogBanner post={post} key={post.id} />)}</AutoSlider>}
    {movies.length > 0 && <AutoSlider className="container home-banner-slider home-banner-slider--media-16by9" eyebrow="Trending now" title="Trending Movies" action={{ label: 'View all movies', to: '/movies' }} autoPlay interval={4800}>{movies.slice(0, 8).map((item) => <MediaBanner item={item} key={item.id} onWatch={() => watch(item)} />)}</AutoSlider>}
    {series.length > 0 && <AutoSlider className="container home-banner-slider home-banner-slider--media-16by9" eyebrow="Binge-worthy stories" title="Popular Series" action={{ label: 'View all series', to: '/series' }} autoPlay interval={5200}>{series.slice(0, 8).map((item) => <MediaBanner item={item} key={item.id} onWatch={() => watch(item)} />)}</AutoSlider>}
    {footerAds.length > 0 && <AutoSlider className="container home-banner-slider home-banner-slider--footer" eyebrow="From our partners" title="Yangon TV Banners" hideHeadingText interval={5600}>{footerAds.map((ad) => <AdBannerSlide ad={ad} key={ad.id} />)}</AutoSlider>}
  </div>;
}

function MediaBanner({ item, onWatch, featured = false }: { item: MediaItem; onWatch: () => void; featured?: boolean }) {
  const detailPath = mediaDetailPath(item);
  return <article className={`home-banner-card ${featured ? 'home-banner-card--featured' : ''}`}>
    <img src={mediaUrl(item.backdrop, item.poster)} alt="" loading={featured ? 'eager' : 'lazy'} />
    <div className="home-banner-card__shade" />
    <div className="home-banner-card__content">{featured && <span className="eyebrow eyebrow--light"><Sparkles size={13} /> Yangon TV original pick</span>}<h2>{item.title}</h2><p>{item.synopsis || item.description}</p><div className="home-banner-card__meta"><span><Star size={12} fill="currentColor" /> {item.rating.toFixed(1)}</span><i /><span>{item.year || 'New release'}</span><i /><span>{item.kind === 'series' ? 'Series' : 'Movie'}</span></div><div className="home-banner-card__actions"><button className="button button--primary" type="button" onClick={onWatch}><Play size={15} fill="currentColor" /> Watch now</button><Link className="button button--glass" to={detailPath}>Details <ArrowRight size={15} /></Link></div></div>
  </article>;
}

function BlogBanner({ post }: { post: BlogPost }) {
  return <Link className="home-banner-card home-banner-card--blog" to={blogPath(post)}><img src={mediaUrl(post.cover || post.image)} alt={post.cover_alt || post.title} loading="lazy" /><div className="home-banner-card__shade" /><div className="home-banner-card__content"><span className="eyebrow eyebrow--light">{post.topic || post.category} · {post.date}</span><h2>{post.title}</h2><p>{post.excerpt}</p><span className="button button--glass">Read story <ArrowRight size={15} /></span></div></Link>;
}

function AdBannerSlide({ ad }: { ad: AdBanner }) {
  const image = <img src={mediaUrl(ad.content)} alt={ad.name} loading="lazy" />;
  return ad.link_url ? <a className="home-banner-ad" href={ad.link_url} target="_blank" rel="noopener noreferrer">{image}</a> : <div className="home-banner-ad">{image}</div>;
}
