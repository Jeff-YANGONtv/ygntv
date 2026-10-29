import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

const manifestPath = '.seo-pages.json';
const outputDir = resolve('dist');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let template = await readFile(join(outputDir, 'index.html'), 'utf8');

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&#39;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setMeta(html, attribute, key, value) {
  const matcher = new RegExp(`<meta\\s+${attribute}=["']${escapeRegExp(key)}["'][^>]*>`, 'i');
  if (value == null || value === '') return html.replace(matcher, '');
  const tag = `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(value)}" />`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function imageType(image) {
  try {
    const extension = new URL(image).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
    if (extension === 'png') return 'image/png';
    if (extension === 'webp') return 'image/webp';
    if (extension === 'avif') return 'image/avif';
  } catch {
    // Omit an unknown image MIME rather than declaring a misleading one.
  }
  return '';
}

function structuredData(page, canonical) {
  const schema = page.schema || {
    '@context': 'https://schema.org',
    '@type': page.type === 'article' ? 'WebPage' : 'CollectionPage',
    name: page.title,
    description: page.description,
    inLanguage: 'my',
  };
  if (!schema.url && !schema.mainEntityOfPage) schema.url = canonical;
  return schema;
}

function applyPageMetadata(html, page) {
  const canonical = `${manifest.origin}${page.path === '/' ? '/' : page.path}`;
  const image = page.image || `${manifest.origin}/yangon-tv-social-cover.webp`;
  const imageAlt = page.imageAlt || page.title;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(page.title)}</title>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'name', 'robots', 'index, follow, max-image-preview:large');
  html = setMeta(html, 'name', 'googlebot', 'index, follow, max-image-preview:large');
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:type', page.type || 'website');
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:site_name', 'Yangon TV');
  html = setMeta(html, 'property', 'og:locale', 'my_MM');
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:type', imageType(image));
  html = setMeta(html, 'property', 'og:image:alt', imageAlt);
  const isDefaultImage = image === `${manifest.origin}/yangon-tv-social-cover.webp`;
  html = setMeta(html, 'property', 'og:image:width', isDefaultImage ? '1200' : '');
  html = setMeta(html, 'property', 'og:image:height', isDefaultImage ? '630' : '');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', page.title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'twitter:image:alt', imageAlt);

  const canonicalMatcher = /<link\s+rel=["']canonical["'][^>]*>/i;
  const canonicalTag = `<link rel="canonical" href="${escapeAttribute(canonical)}" />`;
  html = canonicalMatcher.test(html) ? html.replace(canonicalMatcher, canonicalTag) : html.replace('</head>', `    ${canonicalTag}\n  </head>`);
  html = html.replace(/<script\b[^>]*id=["']yangon-tv-prerendered-schema["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const schemaText = JSON.stringify(structuredData(page, canonical)).replaceAll('<', '\\u003c');
  const schemaScript = `<script id="yangon-tv-prerendered-schema" type="application/ld+json">${schemaText}</script>`;
  return html.replace('</head>', `    ${schemaScript}\n  </head>`);
}

function routeOutputPath(route) {
  let segments;
  try {
    segments = route.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || /[\\/\u0000-\u001f]/.test(segment))) return null;
  const target = resolve(outputDir, ...segments, 'index.html');
  if (!target.startsWith(`${outputDir}${sep}`)) return null;
  return target;
}

for (const root of ['movies', 'series', 'blog', 'about', 'links', 'privacy-policy', 'terms-of-service']) {
  await rm(join(outputDir, root), { recursive: true, force: true });
}

const rootPage = manifest.pages.find((page) => page.path === '/');
if (rootPage) template = applyPageMetadata(template, rootPage);
await writeFile(join(outputDir, 'index.html'), template);

let generated = 0;
for (const page of manifest.pages) {
  if (page.path === '/') continue;
  const target = routeOutputPath(page.path);
  if (!target) {
    console.warn(`Skipped unsafe prerender path: ${page.path}`);
    continue;
  }
  const html = applyPageMetadata(template, page);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
  generated += 1;
}

await unlink(manifestPath).catch(() => undefined);
console.log(`Prerendered metadata for ${generated + (rootPage ? 1 : 0)} public routes`);
