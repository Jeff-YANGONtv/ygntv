import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaCard, SectionHeading } from '../components/ui/Primitives';
import { movies, series, blogs } from '../data/mock';
import { mediaUrl } from '../lib/api';

export function Home() {
  const featured = movies[0];
  return <div className="page page-home">
    <section className="hero"><img className="hero-image" src={mediaUrl(featured.backdrop, featured.backdrop)} alt="" /><div className="hero-shade" /><div className="container hero-content"><span className="eyebrow eyebrow--light"><Sparkles size={14} /> Yangon TV original pick</span><h1>Stories that stay<br /><em>with you.</em></h1><p className="hero-copy">From midnight mysteries to quiet romances, discover stories made to be felt — curated for the way Myanmar watches.</p><div className="hero-meta"><span><Star size={14} fill="currentColor" /> {featured.rating.toFixed(1)} rating</span><i /><span>{featured.year}</span><i /><span>{featured.runtime}</span></div><div className="button-row"><Link className="button button--primary" to={`/movies/${featured.slug}/watch`}><Play size={17} fill="currentColor" /> Watch now</Link><Link className="button button--glass" to={`/movies/${featured.slug}`}>More details <ArrowRight size={16} /></Link></div></div><div className="hero-orbit" /></section>
    <section className="container home-section home-intro"><div><span className="eyebrow">A little closer to home</span><h2>Good stories are<br /><em>better together.</em></h2></div><p>Yangon TV is a place to find the films, series, and voices that make our screens feel a little more like home.</p></section>
    <section className="container home-section"><SectionHeading eyebrow="Handpicked for you" title="Featured movies" action={{ label: 'View all movies', to: '/movies' }} /><div className="media-grid media-grid--featured">{movies.slice(0, 4).map((item) => <MediaCard key={item.id} item={item} />)}</div></section>
    <section className="container home-section"><SectionHeading eyebrow="Binge-worthy stories" title="Series to get lost in" action={{ label: 'Browse series', to: '/series' }} /><div className="media-grid">{series.map((item) => <MediaCard key={item.id} item={item} compact />)}</div></section>
    <section className="container home-section ad-banner"><div><span className="eyebrow">Yangon TV presents</span><h2>One more episode?<br /><em>Always.</em></h2><p>Keep up with what is new, what is next, and what everyone is talking about.</p></div><Link className="button button--primary" to="/blog">Read the latest <ArrowRight size={16} /></Link></section>
    <section className="container home-section home-blog"><SectionHeading eyebrow="From the journal" title="Fresh from the blog" action={{ label: 'See all stories', to: '/blog' }} /><div className="blog-preview-grid">{blogs.slice(0, 2).map((post) => <Link to={`/blog/${post.slug}`} className="blog-preview" key={post.id}><img src={post.image} alt="" /><div><span className="eyebrow">{post.category} · {post.date}</span><h3>{post.title}</h3><p>{post.excerpt}</p><span className="text-link">Read story <ArrowRight size={14} /></span></div></Link>)}</div></section>
  </div>;
}
