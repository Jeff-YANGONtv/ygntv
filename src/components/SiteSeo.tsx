import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { activeSiteOrigin } from '../lib/siteOrigin';

const DEFAULT_TITLE = 'Yangon TV | မြန်မာစာတန်းထိုး Movies, Series & Entertainment';
const DEFAULT_DESCRIPTION = 'Yangon TV မှာ မြန်မာစာတန်းထိုး Movies, Series, Blog နဲ့ Entertainment content တွေကို တစ်နေရာတည်းမှာ ရှာဖွေကြည့်ရှုနိုင်ပါသည်။';
const SOCIAL_IMAGE = '/yangon-tv-social-cover.png';

type SeoConfig = {
  title: string;
  description: string;
  canonical: string;
  index: boolean;
  type?: string;
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

function pageSeo(pathname: string): SeoConfig {
  const siteOrigin = activeSiteOrigin();
  const publicPages: Record<string, Omit<SeoConfig, 'canonical' | 'index'>> = {
    '/': {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      type: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Yangon TV',
        alternateName: 'YGNTV',
        url: siteOrigin,
        inLanguage: ['my', 'en'],
        publisher: { '@type': 'Organization', name: 'Yangon TV', url: siteOrigin },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteOrigin}/movies?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    },
    '/movies': {
      title: 'မြန်မာစာတန်းထိုး Movies | Yangon TV',
      description: 'Yangon TV တွင် မြန်မာစာတန်းထိုး နိုင်ငံတကာရုပ်ရှင်ဇာတ်ကားများကို genre နှင့် title အလိုက်ရှာဖွေကြည့်ရှုနိုင်ပါသည်။',
      type: 'website',
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yangon TV Movies', inLanguage: 'my' },
    },
    '/series': {
      title: 'မြန်မာစာတန်းထိုး Series | Yangon TV',
      description: 'Yangon TV တွင် မြန်မာစာတန်းထိုး နိုင်ငံတကာစီးရီးများ၊ seasons နှင့် episodes များကို ရှာဖွေကြည့်ရှုနိုင်ပါသည်။',
      type: 'website',
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yangon TV Series', inLanguage: 'my' },
    },
    '/blog': {
      title: 'Movie Blog & Entertainment Stories | Yangon TV',
      description: 'Yangon TV Blog တွင် ရုပ်ရှင် reviews၊ watch guides နှင့် entertainment stories များကို မြန်မာဘာသာဖြင့်ဖတ်ရှုနိုင်ပါသည်။',
      type: 'website',
      schema: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Yangon TV Blog', inLanguage: 'my' },
    },
    '/links': { title: 'Yangon TV Official Links', description: 'Yangon TV ၏ official social media နှင့် community links များကို ရှာဖွေပါ။', type: 'website' },
    '/about': { title: 'About Yangon TV | Stories Worth Staying Up For', description: 'Yangon TV ၏ ရည်ရွယ်ချက်၊ အမြင်နှင့် Myanmar audiences အတွက် ဖန်တီးထားသော entertainment platform အကြောင်း လေ့လာနိုင်ပါသည်။', type: 'website' },
    '/privacy-policy': { title: 'Privacy Policy | Yangon TV', description: 'Yangon TV ၏ privacy policy နှင့် user data အသုံးပြုပုံကို ဖတ်ရှုနိုင်ပါသည်။', type: 'article' },
    '/terms-of-service': { title: 'Terms of Service | Yangon TV', description: 'Yangon TV အသုံးပြုသူများအတွက် terms of service နှင့် အသုံးပြုမှုစည်းမျဉ်းများ။', type: 'article' },
  };

  if (pathname.startsWith('/movies/') || pathname.startsWith('/series/')) {
    const watch = pathname.endsWith('/watch');
    return { title: watch ? 'Watch securely | Yangon TV' : 'Movie & Series Details | Yangon TV', description: watch ? 'Yangon TV account ဖြင့် protected player ကို အသုံးပြုရန် ဝင်ရောက်ပါ။' : 'Yangon TV တွင် movie နှင့် series details၊ cast၊ genres နှင့် release information များကို ကြည့်ရှုပါ။', canonical: `${siteOrigin}${pathname}`, index: !watch, type: watch ? 'website' : 'video.other' };
  }
  if (pathname === '/auth' || pathname.startsWith('/auth/') || pathname === '/profile' || pathname === '/history' || pathname === '/subscription' || pathname.startsWith('/profiles/')) {
    return { title: 'Yangon TV', description: DEFAULT_DESCRIPTION, canonical: `${siteOrigin}${pathname}`, index: false, type: 'website' };
  }
  if (pathname.startsWith('/blog/')) return { title: 'Yangon TV Blog', description: DEFAULT_DESCRIPTION, canonical: `${siteOrigin}${pathname}`, index: true, type: 'article' };
  const page = publicPages[pathname] || { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, type: 'website' };
  return { ...page, canonical: `${siteOrigin}${pathname || '/'}`, index: true };
}

export function SiteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const seo = pageSeo(pathname);
    const originalTitle = document.title;
    const restore = [
      setMeta('name', 'description', seo.description),
      setMeta('name', 'robots', seo.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'),
      setMeta('name', 'googlebot', seo.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'),
      setMeta('property', 'og:title', seo.title),
      setMeta('property', 'og:description', seo.description),
      setMeta('property', 'og:type', seo.type || 'website'),
      setMeta('property', 'og:url', seo.canonical),
      setMeta('property', 'og:site_name', 'Yangon TV'),
      setMeta('property', 'og:locale', 'my_MM'),
      setMeta('property', 'og:image', `${activeSiteOrigin()}${SOCIAL_IMAGE}`),
      setMeta('property', 'og:image:alt', 'Yangon TV — Movies, Series, Entertainment'),
      setMeta('name', 'twitter:card', 'summary_large_image'),
      setMeta('name', 'twitter:title', seo.title),
      setMeta('name', 'twitter:description', seo.description),
      setMeta('name', 'twitter:image', `${activeSiteOrigin()}${SOCIAL_IMAGE}`),
    ];
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const createdCanonical = !canonical;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    const previousCanonical = canonical.getAttribute('href');
    canonical.href = seo.canonical;
    const schema = document.createElement('script');
    schema.id = 'yangon-tv-page-schema'; schema.type = 'application/ld+json';
    schema.text = JSON.stringify(seo.schema || { '@context': 'https://schema.org', '@type': seo.type === 'article' ? 'Article' : 'WebPage', name: seo.title, description: seo.description, url: seo.canonical, inLanguage: 'my' }).replace(/</g, '\\u003c');
    document.head.appendChild(schema);
    document.title = seo.title;
    return () => {
      document.title = originalTitle; restore.forEach((entry) => entry()); schema.remove();
      if (createdCanonical) canonical?.remove(); else if (previousCanonical === null) canonical?.removeAttribute('href'); else canonical?.setAttribute('href', previousCanonical);
    };
  }, [pathname]);
  return null;
}
