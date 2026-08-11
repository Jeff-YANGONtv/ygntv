import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, ExternalLink, Instagram, MessageCircle, Send, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getBlogBySlug, getBlogs, mediaUrl } from '../lib/api';
import type { BlogPost } from '../lib/types';
import { EmptyState, ErrorState, SearchField, SectionHeading, SkeletonGrid } from '../components/ui/Primitives';

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = (search = '') => {
    setLoading(true);
    setError(false);
    getBlogs({ search }).then((result) => {
      setPosts(result.data);
    }).catch(() => {
      setError(true);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  return <div className="page page-blog"><section className="container page-heading page-heading--wide"><div><span className="eyebrow">The journal</span><h1>Stories behind<br /><em>the stories.</em></h1><p>A closer look at the films, series, and ideas shaping the way we watch.</p></div><div className="journal-mark">YTV<br /><span>journal</span></div></section><section className="container blog-toolbar"><SearchField value={query} onChange={setQuery} onSubmit={() => load(query)} placeholder="Search the journal..." /></section><section className="container blog-list">{loading ? <SkeletonGrid count={3} /> : error ? <ErrorState onRetry={() => load(query)} /> : posts.length === 0 ? <EmptyState title="No stories found" copy="Try another phrase or check back soon." /> : <>{posts.map((post, index) => <Link to={`/blog/${post.slug}`} className={`article-row ${index === 0 ? 'article-row--featured' : ''}`} key={post.id}><img src={mediaUrl(post.image)} alt="" /><div className="article-row__copy"><span className="eyebrow">{post.category} · {post.date}</span><h2>{post.title}</h2><p>{post.excerpt}</p><span className="text-link">Read story <ArrowRight size={15} /></span></div><span className="article-number">0{index + 1}</span></Link>)}</>}</section></div>;
}

export function BlogDetail() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    Promise.all([getBlogBySlug(slug), getBlogs({ page: 1 })]).then(([current, listing]) => {
      if (!mounted) return;
      setPost(current);
      setRelated(listing.data.filter((item) => item.slug !== slug).slice(0, 2));
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [slug]);
  if (loading) return <div className="container page-loading"><div className="skeleton skeleton-detail" /></div>;
  if (error || !post) return <div className="container page-state"><ErrorState onRetry={() => window.location.reload()} /></div>;
  const copyLink = async () => { await navigator.clipboard?.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <div className="page page-article"><article className="container article"><Link className="back-link" to="/blog"><ArrowLeft size={15} /> Back to the journal</Link><div className="article-heading"><span className="eyebrow">{post.category} · {post.date}</span><h1>{post.title}</h1><p className="article-lede">{post.excerpt}</p><div className="article-byline"><span>{post.author}</span><i /> <span>{post.readTime}</span><button className="text-link" onClick={copyLink}>{copied ? 'Copied' : <><Copy size={14} /> Copy link</>}</button></div></div><img className="article-cover" src={mediaUrl(post.image)} alt="" /><div className="article-body">{post.content.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="article-share"><span>Share this story</span><button className="icon-button" aria-label="Share story"><Share2 size={17} /></button><button className="icon-button" aria-label="Copy link" onClick={copyLink}><Copy size={17} /></button></div></article><section className="container article-related"><SectionHeading title="Keep reading" action={{ label: 'All stories', to: '/blog' }} />{related.length ? <div className="blog-preview-grid">{related.map((item) => <Link to={`/blog/${item.slug}`} className="blog-preview" key={item.id}><img src={mediaUrl(item.image)} alt="" /><div><span className="eyebrow">{item.category} · {item.date}</span><h3>{item.title}</h3><span className="text-link">Read story <ArrowRight size={14} /></span></div></Link>)}</div> : <EmptyState title="No related stories" copy="Explore the journal for more stories." />}</section></div>;
}

export function LinksPage() {
  const links = [{ label: 'Yangon TV on Telegram', detail: 'Updates, releases, and community notes', icon: Send, href: 'https://t.me/' }, { label: 'Yangon TV on Instagram', detail: 'Behind the scenes and daily inspiration', icon: Instagram, href: 'https://instagram.com/' }, { label: 'Join the conversation', detail: 'Tell us what you want to watch next', icon: MessageCircle, href: 'mailto:hello@yangontv.com' }];
  return <div className="page page-links"><section className="container links-heading"><span className="eyebrow">Stay in the loop</span><h1>Find us<br /><em>everywhere.</em></h1><p>Follow along for new releases, watchlist ideas, and the stories we cannot stop talking about.</p></section><section className="container link-list">{links.map(({ label, detail, icon: Icon, href }) => <a className="external-link-card" key={label} href={href} target="_blank" rel="noopener noreferrer"><span className="external-icon"><Icon size={22} /></span><span><b>{label}</b><small>{detail}</small></span><ExternalLink size={18} /></a>)}</section></div>;
}

export function AboutPage() {
  return <div className="page page-about"><section className="container about-hero"><div><span className="eyebrow">About Yangon TV</span><h1>For the stories<br /><em>we call ours.</em></h1></div><div className="about-seal">YTV<br /><small>est. 2024</small></div></section><section className="container about-content"><div className="about-lede"><span className="eyebrow">Our point of view</span><p>Yangon TV is an independent entertainment platform built around the films, series, recaps, and conversations that bring Myanmar audiences closer to the screen.</p></div><div className="about-columns"><div><h2>Curated, not crowded.</h2><p>There is more content than ever. We believe the answer is not more noise — it is better context. Every title on Yangon TV is a small invitation to slow down and find something that feels like yours.</p></div><div><h2>Made for the moment.</h2><p>Our platform is designed to feel easy, warm, and familiar. Whether you are here for a single episode or a late-night rabbit hole, there is always a place to begin.</p></div></div></section><section className="container about-quote"><blockquote>“The stories we return to are the ones that know how to stay.”</blockquote><span>— Yangon TV editorial note</span></section></div>;
}
