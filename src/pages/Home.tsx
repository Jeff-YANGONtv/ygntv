import { useEffect, useState } from 'react';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, MediaCard, SectionHeading, SkeletonGrid } from '../components/ui/Primitives';
import { getBlogs, getMovies, getSeries, mediaUrl } from '../lib/api';
import type { BlogPost, MediaItem } from '../lib/types';

export function Home() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadHome = () => {
    setLoading(true);
    setError(false);
    Promise.all([getMovies({ page: 1 }), getSeries({ page: 1 }), getBlogs({ page: 1 })])
      .then(([moviePage, seriesPage, blogPage]) => {
        setMovies(moviePage.data);
        setSeries(seriesPage.data);
        setBlogs(blogPage.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHome();
  }, []);

  if (loading) return <div className="page page-loading container"><SkeletonGrid count={8} /></div>;
  if (error) return <div className="page page-state container"><ErrorState onRetry={loadHome} /></div>;

  const featured = movies[0];
  if (!featured) return <div className="page page-state container"><EmptyState title="No movies available" copy="The backend has not published any movies yet." /></div>;

  return <div className="page page-home">
    <section className="hero"><img className="hero-image" src={mediaUrl(featured.backdrop, featured.poster)} alt="" /><div className="hero-shade" /><div className="container hero-content"><span className="eyebrow eyebrow--light"><Sparkles size={14} /> Yangon TV original pick</span><h1>Stories that stay<br /><em>with you.</em></h1><p className="hero-copy">From midnight mysteries to quiet romances, discover stories made to be felt — curated for the way Myanmar watches.</p><div className="hero-meta"><span><Star size={14} fill="currentColor" /> {featured.rating.toFixed(1)} rating</span><i /><span>{featured.year}</span><i /><span>{featured.runtime || 'Feature'}</span></div><div className="button-row"><Link className="button button--primary" to={`/movies/${featured.slug}/watch`}><Play size={17} fill="currentColor" /> Watch now</Link><Link className="button button--glass" to={`/movies/${featured.slug}`}>More details <ArrowRight size={16} /></Link></div></div><div className="hero-orbit" /></section>
    <section className="container home-section home-intro"><div><span className="eyebrow">A little closer to home</span><h2>Good stories are<br /><em>better together.</em></h2></div><p>Yangon TV is a place to find the films, series, and voices that make our screens feel a little more like home.</p></section>
    <section className="container home-section"><SectionHeading eyebrow="Handpicked for you" title="Featured movies" action={{ label: 'View all movies', to: '/movies' }} />{movies.length ? <div className="media-grid media-grid--featured">{movies.slice(0, 4).map((item) => <MediaCard key={item.id} item={item} />)}</div> : <EmptyState title="No movies available" copy="The backend has not published any movies yet." />}</section>
    <section className="container home-section"><SectionHeading eyebrow="Binge-worthy stories" title="Series to get lost in" action={{ label: 'Browse series', to: '/series' }} />{series.length ? <div className="media-grid">{series.slice(0, 4).map((item) => <MediaCard key={item.id} item={item} compact />)}</div> : <EmptyState title="No series available" copy="The backend has not published any series yet." />}</section>
    <section className="container home-section ad-banner"><div><span className="eyebrow">Yangon TV presents</span><h2>One more episode?<br /><em>Always.</em></h2><p>Keep up with what is new, what is next, and what everyone is talking about.</p></div><Link className="button button--primary" to="/blog">Read the latest <ArrowRight size={16} /></Link></section>
    <section className="container home-section home-blog"><SectionHeading eyebrow="From the journal" title="Fresh from the blog" action={{ label: 'See all stories', to: '/blog' }} />{blogs.length ? <div className="blog-preview-grid">{blogs.slice(0, 2).map((post) => <Link to={`/blog/${post.slug}`} className="blog-preview" key={post.id}><img src={mediaUrl(post.image)} alt="" /><div><span className="eyebrow">{post.category} · {post.date}</span><h3>{post.title}</h3><p>{post.excerpt}</p><span className="text-link">Read story <ArrowRight size={14} /></span></div></Link>)}</div> : <EmptyState title="No stories available" copy="The backend has not published any journal stories yet." />}</section>
  </div>;
}
