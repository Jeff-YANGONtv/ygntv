import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ExternalLink, Facebook, Handshake, Megaphone, Music2, PhoneCall, Send, UsersRound, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getBlogBySlug, getBlogs, getContactAudiences, getSocials, mediaUrl } from '../lib/api';
import { blogPath } from '../lib/paths';
import type { BlogPost, ContactAudienceChannel, SocialLink } from '../lib/types';
import { EmptyState, ErrorState, SearchField, SectionHeading, SkeletonGrid } from '../components/ui/Primitives';
import { BlogInteractions } from '../components/BlogInteractions';
import '../styles/rich-blog.css';

const SITE_ORIGIN = 'https://ygntv.vercel.app';
const SAFE_IFRAME_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com']);

function safeRichHtml(html: string | null | undefined): string {
  if (!html) return '';
  const sanitized = DOMPurify.sanitize(html, { ADD_TAGS: ['iframe', 'video', 'source', 'figure', 'figcaption'], ADD_ATTR: ['allow', 'allowfullscreen', 'controls', 'loading', 'poster', 'preload', 'playsinline', 'referrerpolicy', 'target'] });
  const container = document.createElement('div');
  container.innerHTML = sanitized;
  container.querySelectorAll<HTMLElement>('iframe').forEach((frame) => {
    try { const url = new URL(frame.getAttribute('src') || ''); if (url.protocol !== 'https:' || !SAFE_IFRAME_HOSTS.has(url.hostname.toLowerCase())) frame.remove(); } catch { frame.remove(); }
  });
  container.querySelectorAll<HTMLElement>('[href], [src], [poster]').forEach((element) => {
    ['href', 'src', 'poster'].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      try { const url = new URL(element.getAttribute(attribute) || ''); if (url.protocol !== 'https:') element.removeAttribute(attribute); } catch { element.removeAttribute(attribute); }
    });
  });
  container.querySelectorAll('a[href]').forEach((link) => link.setAttribute('rel', 'noopener noreferrer'));
  return container.innerHTML;
}

function upsertMeta(attribute: 'name' | 'property', key: string, value: string): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
  element.content = value;
  return element;
}

function useBlogSeo(post: BlogPost | null) {
  useEffect(() => {
    if (!post) return;
    const title = post.seo_title || `${post.title} | Yangon TV`;
    const description = post.meta_description || post.excerpt || `Read ${post.title} on Yangon TV.`;
    const canonical = post.canonical_url || `${SITE_ORIGIN}${blogPath(post)}`;
    const image = mediaUrl(post.og_image || post.cover || post.image);
    const originalTitle = document.title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title); upsertMeta('property', 'og:description', description); upsertMeta('property', 'og:type', 'article'); upsertMeta('property', 'og:url', canonical);
    upsertMeta('name', 'twitter:card', 'summary_large_image'); upsertMeta('name', 'twitter:title', title); upsertMeta('name', 'twitter:description', description);
    if (image) { upsertMeta('property', 'og:image', image); upsertMeta('name', 'twitter:image', image); }
    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) { canonicalLink = document.createElement('link'); canonicalLink.rel = 'canonical'; document.head.appendChild(canonicalLink); }
    canonicalLink.href = canonical;
    const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description, image: image || undefined, author: { '@type': 'Organization', name: post.author || 'Yangon TV Core' }, publisher: { '@type': 'Organization', name: 'Yangon TV' }, datePublished: post.published_at || post.date, dateModified: post.updated_at || post.published_at || post.date, articleSection: post.topic || post.category, mainEntityOfPage: canonical };
    const script = document.createElement('script'); script.id = 'yangon-tv-blog-schema'; script.type = 'application/ld+json'; script.text = JSON.stringify(schema).replace(/</g, '\\u003c'); document.head.appendChild(script);
    document.title = title;
    return () => { document.title = originalTitle; script.remove(); };
  }, [post]);
}

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
  return <div className="page page-blog"><section className="container page-heading page-heading--wide"><div><span className="eyebrow">Yangon TV journal</span><h1>ရုပ်ရှင် Reviews နှင့် Entertainment Stories</h1><p>မြန်မာစာတန်းထိုး ရုပ်ရှင်ဇာတ်ကားများ၊ စီးရီးများနှင့် entertainment news များအတွက် Yangon TV ရဲ့ stories ကိုဖတ်ရှုပါ။</p></div></section><section className="container blog-toolbar"><SearchField value={query} onChange={setQuery} onSubmit={() => load(query)} placeholder="Search blog posts..." /></section><section className="container blog-list">{loading ? <SkeletonGrid count={3} /> : error ? <ErrorState onRetry={() => load(query)} /> : posts.length === 0 ? <EmptyState title="No stories found" copy="Try another phrase or check back soon." /> : <>{posts.map((post, index) => <Link to={blogPath(post)} className={`article-row ${index === 0 ? 'article-row--featured' : ''}`} key={post.id}><img src={mediaUrl(post.cover || post.image)} alt={post.cover_alt || post.title} /><div className="article-row__copy"><span className="eyebrow">{post.topic || post.category} · {post.date}</span><h2>{post.title}</h2><p>{post.excerpt}</p><span className="text-link">Read story <ArrowRight size={15} /></span></div><span className="article-number">0{index + 1}</span></Link>)}</>}</section></div>;
}

export function BlogDetail() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const richHtml = useMemo(() => safeRichHtml(post?.content_html), [post?.content_html]);
  useBlogSeo(post);
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
  return <div className="page page-article"><article className="container article"><Link className="back-link" to="/blog"><ArrowLeft size={15} /> Back to the journal</Link><div className="article-heading"><span className="eyebrow article-topic">{post.topic || post.category}</span><h1>{post.title}</h1><p className="article-lede">{post.excerpt}</p><div className="article-byline"><span>{post.author}</span><i /> <span>{post.readTime}</span></div><div className="article-meta"><span>{post.date}</span><i /><span>{post.topic || post.category}</span></div></div><img className="article-cover" src={mediaUrl(post.cover || post.image)} alt={post.cover_alt || post.title} />{richHtml ? <div className="article-body rich-article" dangerouslySetInnerHTML={{ __html: richHtml }} /> : <div className="article-body">{post.content.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}<BlogInteractions blogId={post.id} returnPath={blogPath(post)} title={post.title} /></article><section className="container article-related"><SectionHeading title="Keep reading" action={{ label: 'All stories', to: '/blog' }} />{related.length ? <div className="blog-preview-grid">{related.map((item) => <Link to={blogPath(item)} className="blog-preview" key={item.id}><img src={mediaUrl(item.cover || item.image)} alt={item.cover_alt || item.title} /><div><span className="eyebrow">{item.topic || item.category} · {item.date}</span><h3>{item.title}</h3><span className="text-link">Read story <ArrowRight size={14} /></span></div></Link>)}</div> : <EmptyState title="No related stories" copy="Explore the journal for more stories." />}</section></div>;
}

export function LinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    getSocials().then((items) => {
      if (mounted) setLinks(items);
    }).catch(() => {
      if (mounted) setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [retryToken]);

  const iconFor = (social: SocialLink) => {
    const value = `${social.name} ${social.icon} ${social.url}`.toLowerCase();
    if (value.includes('facebook')) return Facebook;
    if (value.includes('tiktok') || value.includes('music')) return Music2;
    if (value.includes('telegram') || value.includes('send')) return Send;
    return ExternalLink;
  };

  const detailFor = (social: SocialLink) => {
    const value = `${social.name} ${social.icon}`.toLowerCase();
    if (value.includes('telegram')) return 'Updates, releases, and community notes';
    if (value.includes('facebook')) return 'News, announcements, and community updates';
    if (value.includes('tiktok') || value.includes('music')) return 'Short clips, highlights, and entertainment';
    return 'Follow Yangon TV for the latest updates';
  };

  return <div className="page page-links"><section className="container links-heading"><span className="eyebrow">Stay in the loop</span><h1>Find us<br /><em>everywhere.</em></h1><p>Follow along for new releases, watchlist ideas, and the stories we cannot stop talking about.</p></section><section className="container link-list">{loading ? <div className="state-card"><div className="skeleton state-icon" /><p>Loading social links...</p></div> : error ? <ErrorState onRetry={() => setRetryToken((value) => value + 1)} /> : links.length === 0 ? <EmptyState title="No social links yet" copy="Social accounts added from the panel will appear here." /> : links.map((social) => { const Icon = iconFor(social); return <a className="external-link-card" key={social.id} href={social.url} target="_blank" rel="noopener noreferrer"><span className="external-icon"><Icon size={22} /></span><span><b>{social.name}</b><small>{detailFor(social)}</small></span><ExternalLink size={18} /></a>; })}</section></div>;
}

export function ContactPage() {
  const [channels, setChannels] = useState<ContactAudienceChannel[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<ContactAudienceChannel | null>(null);
  const audiences = [
    { key: 'ads_partner_client', label: 'Ads Partner/Client', icon: Megaphone },
    { key: 'subscribers', label: 'Subscribers', icon: UsersRound },
    { key: 'job_applier', label: 'Job Applier', icon: BriefcaseBusiness },
    { key: 'collaborative_partner', label: 'Collaborative Partner', icon: Handshake },
  ];
  useEffect(() => {
    let active = true;
    getContactAudiences().then((items) => { if (active) setChannels(items); }).catch(() => { if (active) setChannels([]); });
    return () => { active = false; };
  }, []);
  const channelFor = (key: string, fallbackLabel: string): ContactAudienceChannel => channels.find((channel) => channel.key === key) || { key, label: fallbackLabel, telegram_url: null, viber_url: null };
  return <div className="page page-contact"><section className="container contact-page"><span className="eyebrow">Yangon TV contact</span><h1>Contact<br /><em>Us.</em></h1><p>Choose the option that best describes you so Yangon TV can direct you to the right admin contact.</p><div className="contact-audience-grid">{audiences.map(({ key, label, icon: Icon }) => <button className={selectedAudience?.key === key ? 'contact-audience-card contact-audience-card--selected' : 'contact-audience-card'} key={key} type="button" onClick={() => setSelectedAudience(channelFor(key, label))}><span><Icon size={23} /></span><b>{label}</b><ArrowRight size={17} /></button>)}</div></section>{selectedAudience && <ContactAudienceDialog audience={selectedAudience} onClose={() => setSelectedAudience(null)} />}</div>;
}

function ContactAudienceDialog({ audience, onClose }: { audience: ContactAudienceChannel; onClose: () => void }) {
  return <div className="contact-dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" onMouseDown={(event) => event.stopPropagation()}><button className="contact-dialog__close" type="button" onClick={onClose} aria-label="Close contact options"><X size={19} /></button><span className="eyebrow">{audience.label}</span><h2 id="contact-dialog-title">Thanks For<br /><em>Choosing Us.</em></h2><p>Please Contact Admin Via</p><div className="contact-dialog__actions"><ContactChannelButton label="Telegram" href={audience.telegram_url} icon={Send} /><ContactChannelButton label="Viber" href={audience.viber_url} icon={PhoneCall} /></div><small>Contact details are managed from the Yangon TV panel.</small></section></div>;
}

function ContactChannelButton({ label, href, icon: Icon }: { label: string; href?: string | null; icon: typeof Send }) {
  if (href) return <a className="contact-channel-button" href={href} target="_blank" rel="noopener noreferrer"><Icon size={19} /><span>{label}</span><ArrowRight size={16} /></a>;
  return <span className="contact-channel-button contact-channel-button--disabled" aria-disabled="true"><Icon size={19} /><span>{label}</span><small>Not configured</small></span>;
}
