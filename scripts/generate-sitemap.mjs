import { writeFile } from 'node:fs/promises';

const origin = 'https://ygntv.org';
const apiOrigin = process.env.VITE_API_BASE_URL || 'https://api.ygntv.org/api';
const today = new Date().toISOString().slice(0, 10);

async function getJson(path) {
  const response = await fetch(`${apiOrigin}${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function rows(payload) {
  const data = payload?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

function cleanSlug(value) {
  return String(value || '').trim().replace(/-[a-f0-9]{10,}$/i, '');
}

function xmlEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

const urls = [
  ['/', 'weekly', '1.0'],
  ['/movies', 'daily', '0.9'],
  ['/series', 'daily', '0.9'],
  ['/blog', 'weekly', '0.8'],
  ['/about', 'monthly', '0.6'],
  ['/links', 'monthly', '0.5'],
  ['/privacy-policy', 'yearly', '0.3'],
  ['/terms-of-service', 'yearly', '0.3'],
];

try {
  const [moviesPayload, seriesPayload] = await Promise.all([getJson('/movies?page=1'), getJson('/shows?page=1')]);
  for (const movie of rows(moviesPayload)) if (movie.slug) urls.push([`/movies/${encodeURIComponent(cleanSlug(movie.slug))}`, 'weekly', '0.8']);
  for (const series of rows(seriesPayload)) if (series.slug) urls.push([`/series/${encodeURIComponent(cleanSlug(series.slug))}`, 'weekly', '0.8']);
} catch (error) {
  console.warn(`Sitemap catalog fetch skipped: ${error.message}`);
}

const unique = [...new Map(urls.map((item) => [item[0], item])).values()];
const body = unique.map(([path, frequency, priority]) => `  <url><loc>${xmlEscape(origin + path)}</loc><lastmod>${today}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
await Promise.all([writeFile('sitemap.xml', xml), writeFile('public/sitemap.xml', xml)]);
console.log(`Generated ${unique.length} sitemap URLs`);
