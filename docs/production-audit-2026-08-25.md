# Yangon TV Production Audit — 25 August 2026

## Audit Baseline

The frontend TypeScript check and Vite production build both pass. The current public Vercel routes return HTTP 200, and the Vercel `/api` proxy returns public catalogue data. Protected user, playback, dashboard, and admin endpoints return HTTP 401 without an authenticated bearer token.

## Verified Findings

| ID | Area | Severity | Finding | Evidence | Status |
|---|---|---:|---|---|---|
| PA-01 | Series detail data | High | Public URLs remove the generated suffix while Laravel previously required the full stored slug. The backend now resolves an exact canonical slug first, then only a matching hexadecimal generated suffix. The repaired clean Series endpoint returns nested Seasons and Episodes. | Live Vercel proxy and browser validation of `Human Vapor` | Fixed and verified |
| PA-02 | Movie detail data | Medium | Movies used the same clean-slug route and exact-match lookup pattern, causing an unnecessary catalogue fallback. The same canonical clean-slug resolver has been deployed. | Live Vercel proxy check of `scary-movie` returned HTTP 200 and the canonical stored slug without source metadata. | Fixed and verified |
| PA-03 | Series content data | Owner data | `Human Vapor` has eight existing Episode records in Season 1, but its cast field remains empty. The audit did not invent cast information. | Live clean-detail response and Series route | Owner action required for real cast names |
| PA-04 | Nstream embed validation | Owner data | Responsive iframe framing is deployed, but no owner-authorized live Nstream embed has been saved yet for mobile acceptance testing. | Existing tracker and production configuration | Owner action required |
| PA-05 | Scheduler | Critical | The external signed scheduler endpoint is now stored in the GitHub Actions repository secret and a manual workflow run completed successfully. The Laravel scheduler declares the expected cleanup task. | Successful manual workflow `32858816737` and final `php artisan schedule:list` | Fixed and verified |
| PA-06 | Laravel runtime cache | Medium | Configuration, routes, events, and views remain uncached because active production code still calls `env()` outside configuration files. Enabling configuration cache before refactoring those calls could disable provider or bot configuration. | Live production application review | Deferred safely |
| PA-07 | SSH access hardening | High | The Hostinger login banner reports repeated failed SSH authentication attempts. Password authentication remains enabled; key-based access and password rotation remain necessary owner follow-up. | Live SSH login banner | Owner action required |
| PA-08 | Public media source disclosure | Critical | The public Series detail payload initially contained episode stream/download arrays, provider delivery metadata, and a Telegram delivery path. The formatter sanitized a local variable but did not assign it back to the response. It now returns sanitized nested Seasons/Episodes only; Movie and Series detail payloads explicitly strip provider and Telegram delivery metadata. | Final live Vercel proxy payload checks | Fixed and verified |
| PA-09 | Dashboard authorization | High | Dashboard totals and chart routes were inside the generic Sanctum group, allowing any signed-in user to obtain administrator metrics. They now reside in the existing `auth:sanctum + admin` group. | Live route table confirms `EnsureUserIsAdmin` on both routes | Fixed and verified |
| PA-10 | Alternate Season endpoint disclosure | Critical | Public `seasons/{id}` and `seasons/{id}/episodes` responses initially disclosed provider and Telegram delivery metadata even after Movie/Show detail endpoints were sanitized. Season response serialization now removes those fields, including nested Show metadata. | Final live Vercel proxy checks of both public endpoints | Fixed and verified |
| PA-11 | Telegram OAuth callback handling | High | Telegram OAuth used the Google mobile return-URI setting for its expired-state fallback and return-URI allowlist. This copy/paste coupling could send Telegram sign-in failures to the wrong callback when providers differ. Telegram now has its own configuration key and provider-specific default. | Live controller/config source inspection after deployment | Fixed and verified |

## Live Public Checks

The Vercel `/api` proxy successfully returned the public Movies, Shows, and Blog feeds. Direct command-line requests to the Hostinger hostname timed out from the sandbox during this audit, while the production Vercel proxy remained available. The public Home page renders its navigation, trending Movie carousel, and Popular Series carousel correctly at the desktop viewport. Public catalogue buttons currently use the clean public slug paths, which confirms the importance of resolving finding PA-01 and PA-02 at the backend detail endpoints.

The unauthenticated Home-page **Watch now** action opens the intended Sign in / Sign up modal and does not expose playback content before authentication.

A clean-slug Movie detail route renders its public review and cast data successfully through the list fallback, so PA-02 primarily affects efficiency and any detail-only future fields. The clean-slug Series detail issue remains high severity because nested Seasons and Episodes are essential to the Series Watch and Download flow. The public footer also retains a `Useful links` destination that warrants a route check because the owner previously removed the standalone Links navigation.

## Laravel Operational Checks

Laravel is in production mode with debug disabled. All tracked migrations have run, no failed queue jobs are present, and the deployed scheduler declares the intended cleanup task. The external GitHub Actions scheduler endpoint has been configured and the recorded manual workflow run succeeded. Recent Laravel error log entries are from an unsupported historic command option rather than a current application exception.

Config caching remains intentionally deferred: multiple production controllers and services call `env()` directly outside `config/`, so enabling `config:cache` before that refactor could disable active bot or provider configuration.

## Completed Production Repairs and Validation

On 25 August, the backend received dated, compressed backups before each controller change. The deployed clean-slug resolver accepts an exact stored slug first and otherwise accepts only the public slug plus its documented hexadecimal generated suffix. PHP lint passed for each changed controller, and Laravel runtime caches were cleared after each deployment.

The live Vercel proxy confirms that `GET /api/shows/slug/human-vapor` now returns HTTP 200 with its canonical stored slug and nested Season data. Movie and Series detail payloads contain no stream URL, download URL, delivery mode, embed URL, Bunny identifier, or Telegram delivery path. The corresponding unauthenticated episode playback request returns HTTP 401. Browser validation confirms the public Series Review page displays Season 1 and reveals the eight Episode choices only after an explicit Season selection, preserving the required Season-first, Episode-second flow.

Dashboard user totals and chart data are now protected by both Sanctum authentication and the live `EnsureUserIsAdmin` middleware.

The alternate public Season detail and episode-list endpoints were also regression-tested. Both return HTTP 200 with metadata only and no direct delivery fields.

Telegram OAuth now resolves its allowed and fallback mobile callback from `services.telegram.tv_return_uri`, independent of the Google OAuth setting. A real Telegram authorization round-trip remains an owner acceptance test because it requires the configured Telegram account and device handoff.

The footer correction was committed to the frontend main branch, but the live Vercel browser response still displayed the pre-change `Useful links` footer during the immediate deployment validation window. This is tracked as a deployment follow-up rather than a failed local build; the committed source and local production build are correct.

The live Vercel response serves the configured `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers, plus HTTPS transport enforcement. The Blog rich-HTML renderer was also reviewed: it uses DOMPurify, allows only HTTPS media URLs, limits iframes to the approved YouTube/Vimeo hosts, and adds safe link-rel attributes before rendering.

The signed Hostinger scheduler endpoint was regenerated without disclosure, stored as the `HOSTINGER_SCHEDULER_URL` GitHub Actions repository secret, and validated by a successful manual run of workflow `32858816737`. Live source and user-cron searches also found no active `--columns` Artisan invocation; the historical log error is therefore not attributable to an active application or user-cron command.

For the Hostinger frontend migration, the dedicated temporary domain `cyan-oryx-420193.hostingersite.com` was granted explicit credentialed API CORS access after a dated Laravel backup. The Laravel sitemap origin is now configuration-backed and emits this frontend origin. The React static artifact was deployed only after a dated frontend-root backup, with an HTTPS SPA fallback, security headers, static sitemap, and corrected robots URL. Live HTTPS checks returned `200` for the root, a clean Series deep link, sitemap, and robots; the real Human Vapor Season/Episode detail data rendered after the API requests settled.

The live Hostinger homepage was separately verified after data settlement: Trending Movies and Popular Series render their real Laravel API catalogue data, and the public Series Season/Episode detail remains functional. Hostinger currently serves a platform-managed temporary-domain `robots.txt` that disallows Googlebot despite the correct deployed file, so public indexing must be revalidated after the owner maps the final custom production domain and clears any Hostinger cache.

The Hostinger homepage unauthenticated Watch now flow was also browser-tested. It opens the existing Sign in/Sign up dialog and does not expose a playback source or player content.

The Hostinger clean Movie detail route `/movies/scary-movie` was browser-validated with real production metadata and cast data. It renders the intended Review UI and clearly preserves account-gated Watch and Download access.

The supplied Yangon TV 16:9 brand cover was deployed as the public Home Open Graph/Twitter image with the approved description, `Yangon TV — Your Digital Theatre in Your Pocket`. A file-permission issue that initially returned HTTP `403` for the new image was corrected to public-read mode and revalidated at HTTP `200`. Rendered-DOM checks on the live Hostinger site confirm the requested titles: `Welcome To Yangon TV`, `Yangon TV - Movies ( မြန်မာစာတန်းထိုး)`, `Yangon TV - Series (မြန်မာစာတန်းထိုး)`, `Yangon TV - Community/Blog`, and the real Movie detail `Scary Movie - MMsub`. The detail canonical now resolves to the Hostinger origin rather than Vercel.

## Final Production Regression Record

The isolated Hostinger frontend passed HTTP `200` checks for `/`, `/movies`, `/series`, `/blog`, `/movies/scary-movie`, `/series/human-vapor`, `/contact`, `/subscription`, and `/auth`. The static frontend responses retain `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers. The SPA fallback therefore covers the validated catalogue, account, contact, and subscription paths without relying on Vercel.

Credentialed CORS preflight from the Hostinger frontend origin to the Laravel Movies endpoint returned `204` with the same origin and credentials allowed. Public Movie and Show catalogue/detail responses returned `200` and did not contain stream, download, provider, embed, Bunny, or Telegram delivery fields. Unauthenticated requests to watch history, playback, user-count, and dashboard-chart endpoints each returned `401`.

Final Laravel production checks report Laravel `13.23.0`, PHP `8.5.4`, production environment, debug disabled, maintenance mode disabled, no pending migrations, no failed jobs, and the expected minute-level public Telegram cleanup schedule. The public website, API, and panel custom-domain cutover is prepared in `docs/custom-domain-cutover-ygntv.org.md`; it is intentionally not executed until `ygntv.org`, `api.ygntv.org`, and `admin.ygntv.org` are mapped in Hostinger with valid HTTPS certificates.

On the final readiness check, `ygntv.org`, `api.ygntv.org`, and `admin.ygntv.org` did not yet resolve in public DNS. No DNS, SSL, API-origin, or frontend build setting was changed as a result. The temporary Hostinger production-validation release and its dated rollback archives therefore remain the current active deployment.

No public Blog post exists in the current live feed, so a per-post Open Graph cover was not fabricated for test purposes. Once a real post exists, its individual cover must be checked at the real `/blog/{slug}` URL before the custom-domain acceptance is closed.

## Final Custom-Domain Cutover Record

The public production frontend is deployed at `https://ygntv.org`, the Laravel API is deployed at `https://api.ygntv.org/api`, and the web administration panel now responds at `https://admin.ygntv.org` with title `YGN TV Admin Panel`. The existing Telegram Admin Bot remains a separate management interface using the same Laravel backend and was not changed by the web-domain migration.

Before deployment, a dated Laravel configuration archive was created under the new API root and a dated frontend archive was created under the `ygntv.org` frontend-backups directory. The Laravel configuration was updated to allow credentialed CORS from `https://ygntv.org` and to generate sitemap links using that origin. PHP syntax checks passed for the two updated configuration files, Laravel caches were cleared, and the effective application frontend URL was confirmed as `https://ygntv.org`.

The final static frontend was rebuilt with `VITE_SITE_ORIGIN=https://ygntv.org`, `VITE_API_BASE_URL=https://api.ygntv.org/api`, and `VITE_MEDIA_BASE_URL=https://api.ygntv.org`. It was deployed backup-first to the new public root with readable static permissions. Live browser-rendered metadata confirms the requested Home, Movies, Series, Blog, Movie-detail, and Series-detail titles; all canonical URLs are now under `https://ygntv.org`. The supplied Home social cover returns `200` from the final public domain.

The final frontend route matrix returned `200` for Home, Movies, Series, Blog, both clean detail routes, Contact, Subscription, Auth, robots, sitemap, and the social cover. The custom-domain CORS preflight returned `204` with origin `https://ygntv.org` and credentials allowed. The real API regression test passed after deployment. Public Movie/Show list and detail endpoints returned `200` without delivery-source fields; unauthenticated history, playback, user-count, and dashboard-chart requests returned `401`. The public sitemap was corrected to serve XML rather than the SPA fallback and its root URL is `https://ygntv.org/`.

The deployed `.htaccess` still contains the intended static security-header rules, but cache-bypassed final CDN responses currently do not expose `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy`. This is a Hostinger/CDN-layer configuration gap rather than a missing frontend artifact and remains open for the owner or Hostinger support to enable at the public domain layer.

## Public Access Repair After Cutover

After the owner reported that the newly cut-over public site could not be entered, DNS, TLS, HTTP routing, API reachability, and browser behavior were rechecked. The final domain had valid DNS, a valid Let’s Encrypt certificate, and HTTP `200`, but the initial browser screenshot was an empty dark viewport while the large initial JavaScript asset loaded. Browser resource timings showed an approximately 19.7-second initial JavaScript transfer and 5–7-second homepage API requests on the tested path.

The frontend was repaired backup-first with route-level code splitting and a critical inline `Loading Yangon TV…` HTML shell. The initial compressed JavaScript entry reduced from roughly 375 KB to roughly 150 KB, and visitors now see a branded loading state immediately rather than an empty screen. A cache-bypassed browser check confirmed the loading state appears first and transitions to the complete interactive homepage. A dated rollback archive was retained under the public frontend backups before this repair deployment.

## Final Frontend and Backend Production Audit

The final `ygntv.org` frontend source checks passed: TypeScript linting, a final-domain production build, and the production dependency audit reported no known high-severity production-package vulnerability. Cache-bypassed public checks returned HTTP `200` for Home, Movies, Series, Blog, clean Movie/Series detail routes, Contact, Subscription, Auth, `robots.txt`, the XML sitemap, and the supplied social cover. The static Home metadata uses the requested title, absolute `https://ygntv.org/` canonical URL, and the public Home social cover; the rendered Movie detail changes its document title to `Scary Movie - MMsub` after loading.

The frontend's final API preflight accepts `https://ygntv.org` with credentials. Public movie and show detail lookups use the supported clean-slug endpoints and return HTTP `200` without stream, download, provider, Bunny, embed, or Telegram delivery fields. The frontend's static `ygntv.org/sitemap.xml` is the public sitemap delivery point; the Laravel application does not register a separate backend sitemap route, so a backend `404` at that unused path is not a public sitemap failure.

The live Laravel audit confirms production mode, debug disabled, maintenance disabled, all migrations applied, no failed queue jobs, and the expected minute-level expired Telegram-message cleanup schedule registered. The final route table verifies that user-count and dashboard chart endpoints require both Sanctum authentication and the admin middleware. Source lint checks passed for the changed app/CORS configuration and public serializers. The application log has no new error entries on 25 or 26 August; its last recorded error entry predates the cutover. Storage logs and framework cache storage remain small, and the host retains substantial free disk capacity.

Independent public reachability checks from Yangon, Singapore, Bangkok, Dhaka, and Germany all returned HTTP `200` for `ygntv.org` after the reported Android timeout. The static public response still exposes only the CDN `upgrade-insecure-requests` content-security policy; the intended `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` remain the one open Hostinger/CDN-layer configuration item.

## Hostinger Delivery Hardening Completion

The remaining header gap was traced to the live Hostinger public root using an older minimal `.htaccess` file, not to Vercel and not to CDN stripping. The verified source deployment rules already contained the required LiteSpeed-compatible rewrite, static cache, compression, and security-header directives. The stale live `.htaccess` was backed up under the `ygntv.org` frontend backup directory and replaced with the reviewed source rules.

Both direct LiteSpeed-origin and cache-bypassed public Hostinger CDN responses now expose `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: geolocation=(), microphone=(), camera=()`, while retaining the provider's `upgrade-insecure-requests` content-security policy. The final public regression returned HTTP `200` for public frontend routes, details, sitemap, and robots; API CORS still permits the final public origin with credentials; clean public media detail endpoints remain `200`; and unauthenticated history and playback endpoints remain `401`.

## Constraints

No mock users, payments, content, episodes, casts, blogs, or media will be created during the audit. Backend corrections will be backed up, syntax checked, cache-cleared, and endpoint-validated before release.
