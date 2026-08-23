import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_ORIGIN = 'https://ygntv.vercel.app';
const DEFAULT_TITLE = 'Yangon TV | မြန်မာစာတန်းထိုး ရုပ်ရှင်ဇာတ်ကားများ';
const DEFAULT_DESCRIPTION = 'Yangon TV တွင် မြန်မာစာတန်းထိုး ရုပ်ရှင်ဇာတ်ကားများ၊ စီးရီးများ၊ reviews နှင့် entertainment stories များကို ရှာဖွေကြည့်ရှုနိုင်ပါသည်။';

type SeoConfig = {
  title: string;
  description: string;
  canonical: string;
  schema?: Record<string, unknown>;
};

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  const created = !element;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  const previous = element.getAttribute('content');
  element.setAttribute('content', value);
  return () => {
    if (created) element?.remove();
    else if (previous === null) element?.removeAttribute('content');
    else element?.setAttribute('content', previous);
  };
}

function pageSeo(pathname: string): SeoConfig | null {
  const pages: Record<string, Omit<SeoConfig, 'canonical'>> = {
    '/': {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Yangon TV',
        url: SITE_ORIGIN,
        inLanguage: 'my',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_ORIGIN}/movies?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    },
    '/movies': {
      title: 'မြန်မာစာတန်းထိုး ရုပ်ရှင်ဇာတ်ကားများ | Yangon TV',
      description: 'Yangon TV တွင် မြန်မာစာတန်းထိုး နိုင်ငံတကာရုပ်ရှင်ဇာတ်ကားများကို genre နှင့် title အလိုက်ရှာဖွေနိုင်ပါသည်။',
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yangon TV Movies', inLanguage: 'my' },
    },
    '/series': {
      title: 'မြန်မာစာတန်းထိုး စီးရီးများ | Yangon TV',
      description: 'Yangon TV တွင် မြန်မာစာတန်းထိုး နိုင်ငံတကာစီးရီးများနှင့် episode information များကို ရှာဖွေကြည့်ရှုနိုင်ပါသည်။',
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yangon TV Series', inLanguage: 'my' },
    },
    '/blog': {
      title: 'ရုပ်ရှင် Reviews နှင့် Entertainment Blog | Yangon TV',
      description: 'Yangon TV Blog တွင် ရုပ်ရှင် reviews၊ watch guides နှင့် entertainment stories များကို မြန်မာဘာသာဖြင့်ဖတ်ရှုနိုင်ပါသည်။',
      schema: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Yangon TV Blog', inLanguage: 'my' },
    },
    '/contact': {
      title: 'Contact Yangon TV | Media & Entertainment',
      description: 'Yangon TV ကို advertising, collaboration, subscriber support နှင့် job enquiries အတွက် ဆက်သွယ်နိုင်ပါသည်။',
    },
    '/subscription': {
      title: 'Yangon TV Membership & Points',
      description: 'Yangon TV Membership နှင့် Points redemption options များကို လေ့လာနိုင်ပါသည်။',
    },
  };

  if (pathname.startsWith('/blog/') || pathname.startsWith('/movies/') || pathname.startsWith('/series/') || pathname.startsWith('/profiles/') || pathname === '/auth' || pathname === '/profile' || pathname === '/links') return null;
  const page = pages[pathname];
  if (!page) return null;
  return { ...page, canonical: `${SITE_ORIGIN}${pathname}` };
}

export function SiteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = pageSeo(pathname);
    if (!seo) return;

    const originalTitle = document.title;
    const restore = [
      setMeta('name', 'description', seo.description),
      setMeta('name', 'robots', 'index, follow, max-image-preview:large'),
      setMeta('property', 'og:title', seo.title),
      setMeta('property', 'og:description', seo.description),
      setMeta('property', 'og:type', 'website'),
      setMeta('property', 'og:url', seo.canonical),
      setMeta('property', 'og:site_name', 'Yangon TV'),
      setMeta('property', 'og:locale', 'my_MM'),
      setMeta('name', 'twitter:card', 'summary_large_image'),
      setMeta('name', 'twitter:title', seo.title),
      setMeta('name', 'twitter:description', seo.description),
    ];
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const previousCanonical = canonical.getAttribute('href');
    canonical.href = seo.canonical;

    const schema = document.createElement('script');
    schema.id = 'yangon-tv-page-schema';
    schema.type = 'application/ld+json';
    schema.text = JSON.stringify(seo.schema || { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, inLanguage: 'my' }).replace(/</g, '\\u003c');
    document.head.appendChild(schema);
    document.title = seo.title;

    return () => {
      document.title = originalTitle;
      restore.forEach((entry) => entry());
      schema.remove();
      if (createdCanonical) canonical?.remove();
      else if (previousCanonical === null) canonical?.removeAttribute('href');
      else canonical?.setAttribute('href', previousCanonical);
    };
  }, [pathname]);

  return null;
}
