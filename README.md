# Yangon TV frontend

A premium dark React + Vite frontend for Yangon TV. The implementation is intentionally self-contained in this repository and does not require a managed web-project scaffold.

## Run locally

```bash
npm install
npm run dev
```

Create a local `.env` from `.env.example` when connecting the Laravel backend. The UI now uses backend responses only; if the API is unavailable, the relevant route shows an error or empty state instead of demo content.

## Routes

- `/` — Home
- `/movies` — Movie catalogue
- `/movies/:slug` — Movie detail
- `/movies/:slug/watch` — Movie watching page
- `/series` — Series catalogue
- `/series/:slug` — Series detail
- `/series/:slug/watch` — Series watching page
- `/blog` — Blog and recap list
- `/blog/:slug` — Blog article detail
- `/links` — Social and useful links
- `/about` — About Yangon TV

## Structure

- `src/layouts/AppLayout.tsx` — responsive navigation, footer, notifications, and mobile navigation
- `src/components/ui/Primitives.tsx` — reusable cards, fields, pills, states, skeletons, and pagination
- `src/lib/api.ts` — Axios client, media URL resolver, API envelope normalization, and backend-only requests
- `src/pages/` — route-level screens
- `src/styles.css` — responsive dark design system
- `vercel.json` and `public/.htaccess` — SPA fallback rewrites for nested routes
- `public/yangon-tv-logo.jpg` — the supplied original Yangon TV logo
- `public/favicon.ico`, `public/icon-192.png`, and `public/icon-512.png` — the supplied logo in browser and PWA icon formats
- `public/apple-touch-icon.png` — iOS home-screen icon using the supplied logo
- `public/site.webmanifest` — installable web-app metadata
- `public/robots.txt` and `public/sitemap.xml` — basic crawl configuration for production deployments

Production artwork and media are resolved from API response URLs and `VITE_MEDIA_BASE_URL` or the backend media host. No mock catalog or blog data is bundled in the frontend.
