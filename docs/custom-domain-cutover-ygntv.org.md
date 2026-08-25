# Yangon TV Custom-Domain Cutover Runbook

## Purpose and current release state

This runbook prepares the final transition from the isolated Hostinger validation site to the approved public domains. It does **not** authorize a DNS change by itself. The current React frontend remains live and validated on `https://cyan-oryx-420193.hostingersite.com`; the Laravel application and API remain separately hosted on `https://khaki-yak-457838.hostingersite.com`. The existing Vercel release must remain untouched as a rollback reference until the custom-domain checks below are complete.

| Surface | Target hostname | Intended service | Required separation |
|---|---|---|---|
| Public website | `ygntv.org` | React/Vite static frontend | Must not overwrite the Laravel document root. |
| Public API | `api.ygntv.org` | Laravel application at `/api` | Must continue enforcing authenticated playback and admin-only metrics. |
| Administration | `admin.ygntv.org` | Existing Laravel admin panel | Must be protected by the existing admin authorization boundary. |

> **Cutover rule:** Do not change frontend API URLs, canonical URLs, or DNS until every hostname is mapped in Hostinger and has a valid HTTPS certificate.

## Preconditions

The owner or Hostinger control panel must first confirm that all three requested hostnames are attached to the intended sites and that certificate issuance has completed. `ygntv.org` needs the isolated static-site document root. `api.ygntv.org` and `admin.ygntv.org` must resolve to the Laravel application without exposing a directory listing or a second, unreviewed application copy.

| Check | Required result | Why it matters |
|---|---|---|
| DNS resolution | Each hostname resolves to the correct Hostinger site. | Prevents traffic from reaching the temporary site or an unrelated root. |
| TLS certificate | HTTPS is valid for `ygntv.org`, `api.ygntv.org`, and `admin.ygntv.org`. | Avoids failed secure cookies, blocked browser requests, and broken social previews. |
| Rollback archive | A dated static-site archive and a Laravel production backup exist before any replacement. | Enables a tested reversal without touching user data. |
| Resource separation | Static files are deployed only to the public-frontend root; Laravel remains in its current root. | Prevents an accidental API/admin outage. |
| Credential remediation | SSH password access is replaced with a rotated credential and key-only access where Hostinger permits it. | The server reports repeated failed SSH logins, so the existing password-based access should be retired. |

## Ordered cutover procedure

First, take fresh dated backups of the static frontend root and the reviewed Laravel application files. Do not delete the temporary frontend site or the Vercel release. Keep both until the custom-domain verification matrix passes.

### 1. Prepare Laravel for the new public origin

On the existing Laravel deployment, add only `https://ygntv.org` to the credentialed CORS allow-list. If `www.ygntv.org` will be served, choose a single canonical redirect policy first and add it only when it is a real supported frontend origin. Set the deployed `FRONTEND_URL` environment value to `https://ygntv.org`; this supplies the sitemap’s public links.

After the configuration change, lint the modified PHP/configuration files, run `php artisan optimize:clear`, and validate the deployed configuration. The public API must be served from `https://api.ygntv.org/api`; do not move Laravel’s source into the static frontend root.

| Laravel validation | Expected result |
|---|---|
| `OPTIONS https://api.ygntv.org/api/movies` with `Origin: https://ygntv.org` | `204`, matching `Access-Control-Allow-Origin`, and `Access-Control-Allow-Credentials: true`. |
| `GET https://api.ygntv.org/api/movies` | Public catalog responds successfully and does not include stream, download, provider, embed, Bunny, or Telegram delivery fields. |
| `GET https://api.ygntv.org/api/tv/library/history` without a session | `401`. |
| `GET https://api.ygntv.org/api/tv/playback/movies/{id}` without a session | `401`. |
| Admin metric endpoints without an admin session | `401` or `403`; they must not become public. |
| `GET https://api.ygntv.org/sitemap.xml` | All generated public URLs begin with `https://ygntv.org`. |

### 2. Build the static frontend for the final origin

Create the final artifact only after HTTPS is ready. Build it with the final public values rather than with the temporary Hostinger hostname:

```bash
VITE_SITE_ORIGIN=https://ygntv.org \
VITE_API_BASE_URL=https://api.ygntv.org/api \
VITE_MEDIA_BASE_URL=https://api.ygntv.org \
pnpm build
```

Before packaging, set the static `index.html` canonical and Home Open Graph/Twitter image URLs to absolute `https://ygntv.org` values. The resulting initial HTML must contain `https://ygntv.org/` as its canonical URL and `https://ygntv.org/yangon-tv-social-cover.png` as the Home social image. This avoids a temporary-host canonical being cached by a crawler before React runs.

Deploy the verified artifact only to the `ygntv.org` static document root. Preserve the SPA `.htaccess` rules, `sitemap.xml`, and `robots.txt`. After extraction, set directories to executable/readable mode and public static files to `644`, including `yangon-tv-social-cover.png`; this prevents a repeat of the previously corrected image-permission `403`.

### 3. Verify the custom-domain release before any retirement

Run the following matrix after DNS and certificate propagation. The Home title, page titles, and detail title are owner-approved production requirements.

| URL or check | Required result |
|---|---|
| `https://ygntv.org/` | HTTP `200`, title `Welcome To Yangon TV`, approved tagline, canonical at `https://ygntv.org/`, and Home social cover URL at the same origin. |
| `/movies`, `/series`, `/blog` | HTTP `200` with the requested Movies, Series, and Blog titles. |
| `/movies/scary-movie`, `/series/human-vapor` | HTTP `200`; visible public metadata; `{title} - MMsub` title; detail canonical begins with `https://ygntv.org/`. |
| A real `/blog/{slug}` post, once one exists | Its Open Graph image stays the post’s own uploaded cover rather than the Home social cover. No test post should be created for this check. |
| `/contact`, `/subscription`, `/auth` | HTTP `200` through SPA fallback. |
| `/robots.txt`, `/sitemap.xml` | Crawlers receive the deployed files and sitemap URLs point to `https://ygntv.org`. The temporary Hostinger Googlebot block must not persist on the custom domain. |
| Response headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` remain present. |
| `https://api.ygntv.org/api/movies` | React data loads from the new API origin with the CORS result described above. |
| `https://admin.ygntv.org` | Administration landing page resolves only through the intended protected Laravel panel. |

## Rollback and acceptance

If a check fails, restore the dated static-site archive or revert the Laravel configuration to the temporary frontend origin, clear Laravel configuration cache, and keep the Vercel release untouched. Do not delete temporary Hostinger files until a complete browser regression and social-crawler fetch succeed.

Acceptance requires all production URLs in the table to pass, no delivery metadata in public API payloads, unauthenticated playback/history denial, a valid custom-domain sitemap and robots response, and no new Laravel queue failures or migration drift. A real-device Telegram OAuth acceptance test and a real authorized Nstream iframe playback test remain owner-facing operational checks; neither should be simulated with fabricated accounts or content.
