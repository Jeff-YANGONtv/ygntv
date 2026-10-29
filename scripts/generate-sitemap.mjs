import { writeFile } from 'node:fs/promises';

const origin = (process.env.VITE_SITE_ORIGIN || 'https://ygntv.org').replace(/\/$/, '');
const apiOrigin = (process.env.VITE_API_BASE_URL || 'https://api.ygntv.org/api').replace(/\/$/, '');
const mediaOrigin = (process.env.VITE_MEDIA_BASE_URL || 'https://api.ygntv.org').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const manifestPath = '.seo-pages.json';

async function getJson(path) {
  const response = await fetch(`${apiOrigin}${path}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function rows(payload) {
  if (Array.isArray(payload)) return payload;
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function pageCount(payload) {
  const nested = payload?.data && !Array.isArray(payload.data) ? payload.data : null;
  const meta = payload?.meta || nested?.meta || payload;
  const count = Number(meta?.last_page ?? meta?.lastPage ?? meta?.total_pages ?? 1);
  return Number.isFinite(count) && count > 0 ? Math.min(count, 1000) : 1;
}

async function getAllRows(path) {
  const results = [];
  let lastPage = 1;
  for (let page = 1; page <= lastPage; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const payload = await getJson(`${path}${separator}page=${page}`);
    results.push(...rows(payload));
    if (page === 1) lastPage = pageCount(payload);
  }
  return results;
}

async function safeRows(label, path) {
  try {
    const items = await getAllRows(path);
    console.log(`Fetched ${items.length} ${label}`);
    return items;
  } catch (error) {
    console.warn(`${label} fetch skipped: ${error.message}`);
    return [];
  }
}

function cleanSlug(value) {
  return String(value || '').trim().replace(/-[a-f0-9]{10,}$/i, '');
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function plainText(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function description(value, fallback) {
  const text = plainText(value) || fallback;
  const chars = Array.from(text);
  return chars.length > 160 ? `${chars.slice(0, 157).join('').trimEnd()}…` : text;
}

function absoluteImage(value) {
  const image = String(value ?? '').trim();
  if (!image) return `${origin}/yangon-tv-social-cover.webp`;
  if (/^https?:\/\//i.test(image)) return image;
  return `${mediaOrigin}/${image.replace(/^\/+/, '')}`;
}

function dateOnly(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : today;
}

const staticPages = [
  {
    path: '/',
    title: 'Yangon TV | မြန်မာစာတန်းထိုး Movies, Series & Entertainment',
    description: 'Yangon TV မှာ မြန်မာစာတန်းထိုး Movies, Series, Blog နဲ့ Entertainment content တွေကို တစ်နေရာတည်းမှာ ရှာဖွေကြည့်ရှုနိုင်ပါသည်။',
    image: `${origin}/yangon-tv-social-cover.webp`,
    type: 'website',
    frequency: 'weekly',
    priority: '1.0',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Yangon TV',
      alternateName: 'YGNTV',
      url: origin,
      inLanguage: ['my', 'en'],
      publisher: { '@type': 'Organization', name: 'Yangon TV', url: origin },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/movies?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  },
  {
    path: '/movies',
    title: 'မြန်မာစာတန်းထိုး Movies | Yangon TV',
    description: 'Yangon TV တွင် မြန်မာစာတန်းထိုး နိုင်ငံတကာရုပ်ရှင်ဇာတ်ကားများကို genre နှင့် title အလိုက်ရှာဖွေကြည့်ရှုနိုင်ပါသည်။',
    type: 'website', frequency: 'daily', priority: '0.9',
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yangon TV Movies', inLanguage: 'my' },
  },
  {
    path: '/series',
    title: 'မြန်မာစာတန်းထိုး Series | Yangon TV',
    description: 'Yangon TV တွင် မြန်မာစာတန်းထိုး နိုင်ငံတကာစီးရီးများ၊ seasons နှင့် episodes များကို ရှာဖွေကြည့်ရှုနိုင်ပါသည်။',
    type: 'website', frequency: 'daily', priority: '0.9',
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yangon TV Series', inLanguage: 'my' },
  },
  {
    path: '/blog',
    title: 'Movie Blog & Entertainment Stories | Yangon TV',
    description: 'Yangon TV Blog တွင် ရုပ်ရှင် reviews၊ watch guides နှင့် entertainment stories များကို မြန်မာဘာသာဖြင့်ဖတ်ရှုနိုင်ပါသည်။',
    type: 'website', frequency: 'weekly', priority: '0.8',
    schema: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Yangon TV Blog', inLanguage: 'my' },
  },
  {
    path: '/about',
    title: 'About Yangon TV | Stories Worth Staying Up For',
    description: 'Yangon TV ၏ ရည်ရွယ်ချက်၊ အမြင်နှင့် Myanmar audiences အတွက် ဖန်တီးထားသော entertainment platform အကြောင်း လေ့လာနိုင်ပါသည်။',
    type: 'website', frequency: 'monthly', priority: '0.6',
  },
  {
    path: '/links',
    title: 'Yangon TV Official Links',
    description: 'Yangon TV ၏ official social media နှင့် community links များကို ရှာဖွေပါ။',
    type: 'website', frequency: 'monthly', priority: '0.5',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Yangon TV',
    description: 'Yangon TV ၏ privacy policy နှင့် user data အသုံးပြုပုံကို ဖတ်ရှုနိုင်ပါသည်။',
    type: 'article', frequency: 'yearly', priority: '0.3',
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service | Yangon TV',
    description: 'Yangon TV အသုံးပြုသူများအတွက် terms of service နှင့် အသုံးပြုမှုစည်းမျဉ်းများ။',
    type: 'article', frequency: 'yearly', priority: '0.3',
  },
];

function mediaPage(item, kind) {
  const slug = cleanSlug(item.slug);
  if (!slug) return null;
  const path = `/${kind === 'movie' ? 'movies' : 'series'}/${encodeURIComponent(slug)}`;
  const title = String(item.title || item.name || '').trim();
  if (!title) return null;
  const year = String(item.year || item.release_date || '').slice(0, 4);
  const kindLabel = kind === 'movie' ? 'Movie' : 'Series';
  const mediaImage = absoluteImage(item.backdrop || item.poster || item.poster_url || item.poster_path);
  const synopsis = item.synopsis || item.review || item.description;
  const summary = description(synopsis, `Explore ${title}, a ${kindLabel.toLowerCase()} on Yangon TV.`);
  const casts = Array.isArray(item.casts) ? item.casts : Array.isArray(item.cast) ? item.cast : [];
  const genres = Array.isArray(item.genres) ? item.genres : [];
  const schema = {
    '@context': 'https://schema.org',
    '@type': kind === 'movie' ? 'Movie' : 'TVSeries',
    name: title,
    description: summary,
    image: mediaImage,
    datePublished: item.release_date || undefined,
    genre: genres.length ? genres : undefined,
    actor: casts.length ? casts.map((name) => ({ '@type': 'Person', name: String(typeof name === 'string' ? name : name?.name || '') })).filter((person) => person.name) : undefined,
    aggregateRating: Number.isFinite(Number(item.rating)) && Number(item.rating) > 0 ? { '@type': 'AggregateRating', ratingValue: Number(item.rating), bestRating: 10 } : undefined,
    mainEntityOfPage: `${origin}${path}`,
  };
  return {
    path,
    title: `${title}${year ? ` (${year})` : ''} | ${kindLabel} | Yangon TV`,
    description: summary,
    image: mediaImage,
    imageAlt: `${title}${year ? ` (${year})` : ''} ${kindLabel.toLowerCase()} poster`,
    type: kind === 'movie' ? 'video.movie' : 'video.tv_show',
    lastmod: dateOnly(item.updated_at || item.created_at),
    frequency: 'weekly', priority: '0.8', schema,
  };
}

function blogPage(post) {
  const slug = String(post.slug || '').trim();
  const id = String(post.id ?? '').trim();
  if (!slug || !id) return null;
  const date = String(post.published_at || post.date || '');
  const year = /^\d{4}/.test(date) ? date.slice(0, 4) : String(new Date().getFullYear());
  const path = `/blog/${encodeURIComponent(`${id}-${year}`)}/${encodeURIComponent(slug)}`;
  const title = String(post.title || '').trim();
  if (!title) return null;
  const summary = description(post.meta_description || post.excerpt, `Read ${title} on Yangon TV.`);
  const image = absoluteImage(post.og_image || post.cover || post.image);
  const canonical = `${origin}${path}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: summary,
    image,
    author: { '@type': 'Organization', name: post.author || 'Yangon TV' },
    publisher: { '@type': 'Organization', name: 'Yangon TV' },
    datePublished: post.published_at || post.date || undefined,
    dateModified: post.updated_at || post.published_at || post.date || undefined,
    articleSection: post.topic || post.category || undefined,
    mainEntityOfPage: canonical,
  };
  return {
    path,
    title: post.seo_title || `${title} | Yangon TV`,
    description: summary,
    image,
    imageAlt: String(post.cover_alt || title),
    type: 'article',
    lastmod: dateOnly(post.updated_at || post.published_at || post.date),
    frequency: 'monthly', priority: '0.7', schema,
  };
}

const [movies, series, blogs] = await Promise.all([
  safeRows('movies', '/movies'),
  safeRows('series', '/shows'),
  safeRows('published blog posts', '/public/blogs'),
]);

const pages = [...staticPages];
for (const item of movies) {
  const page = mediaPage(item, 'movie');
  if (page) pages.push(page);
}
for (const item of series) {
  const page = mediaPage(item, 'series');
  if (page) pages.push(page);
}
for (const post of blogs) {
  const page = blogPage(post);
  if (page) pages.push(page);
}

const uniquePages = [...new Map(pages.map((page) => [page.path, page])).values()];
const sitemapBody = uniquePages.map((page) => {
  const loc = escapeXml(`${origin}${page.path === '/' ? '/' : page.path}`);
  const lastmod = page.lastmod || today;
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${page.frequency}</changefreq><priority>${page.priority}</priority></url>`;
}).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapBody}\n</urlset>\n`;
await Promise.all([
  writeFile('sitemap.xml', xml),
  writeFile('public/sitemap.xml', xml),
  writeFile(manifestPath, JSON.stringify({ origin, pages: uniquePages }, null, 2)),
]);
console.log(`Generated ${uniquePages.length} sitemap URLs and ${uniquePages.length} prerender metadata records`);
