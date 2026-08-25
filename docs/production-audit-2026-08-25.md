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
| PA-05 | Scheduler | Critical | The GitHub Actions Hostinger scheduler workflow has repeatedly failed because the required signed URL secret is absent. The Hostinger user account has no direct crontab entry, so the scheduled Laravel cleanup task is not independently triggered. | Recent GitHub Actions runs and live `crontab -l` | Open |
| PA-06 | Laravel runtime cache | Medium | Configuration, routes, events, and views are not cached in production. This does not currently break functionality but adds avoidable bootstrap overhead. | Live `php artisan about --only=cache` | Open |
| PA-07 | SSH access hardening | High | The Hostinger login banner reports repeated failed SSH authentication attempts. Password authentication remains enabled; key-based access and password rotation remain necessary owner follow-up. | Live SSH login banner | Owner action required |
| PA-08 | Public media source disclosure | Critical | The public Series detail payload initially contained episode stream/download arrays, provider delivery metadata, and a Telegram delivery path. The formatter sanitized a local variable but did not assign it back to the response. It now returns sanitized nested Seasons/Episodes only; Movie and Series detail payloads explicitly strip provider and Telegram delivery metadata. | Final live Vercel proxy payload checks | Fixed and verified |
| PA-09 | Dashboard authorization | High | Dashboard totals and chart routes were inside the generic Sanctum group, allowing any signed-in user to obtain administrator metrics. They now reside in the existing `auth:sanctum + admin` group. | Live route table confirms `EnsureUserIsAdmin` on both routes | Fixed and verified |
| PA-10 | Alternate Season endpoint disclosure | Critical | Public `seasons/{id}` and `seasons/{id}/episodes` responses initially disclosed provider and Telegram delivery metadata even after Movie/Show detail endpoints were sanitized. Season response serialization now removes those fields, including nested Show metadata. | Final live Vercel proxy checks of both public endpoints | Fixed and verified |
| PA-11 | Telegram OAuth callback handling | High | Telegram OAuth used the Google mobile return-URI setting for its expired-state fallback and return-URI allowlist. This copy/paste coupling could send Telegram sign-in failures to the wrong callback when providers differ. Telegram now has its own configuration key and provider-specific default. | Live controller/config source inspection after deployment | Fixed and verified |

## Live Public Checks

The Vercel `/api` proxy successfully returned the public Movies, Shows, and Blog feeds. Direct command-line requests to the Hostinger hostname timed out from the sandbox during this audit, while the production Vercel proxy remained available. The public Home page renders its navigation, trending Movie carousel, and Popular Series carousel correctly at the desktop viewport. Public catalogue buttons currently use the clean public slug paths, which confirms the importance of resolving finding PA-01 and PA-02 at the backend detail endpoints.

The unauthenticated Home-page **Watch now** action opens the intended Sign in / Sign up modal and does not expose playback content before authentication.

A clean-slug Movie detail route renders its public review and cast data successfully through the list fallback, so PA-02 primarily affects efficiency and any detail-only future fields. The clean-slug Series detail issue remains high severity because nested Seasons and Episodes are essential to the Series Watch and Download flow. The public footer also retains a `Useful links` destination that warrants a route check because the owner previously removed the standalone Links navigation.

## Live Laravel Operational Checks

Laravel is in production mode with debug disabled. All 33 tracked migrations have run, no failed queue jobs are present, and log storage is small. The deployed scheduler declares the intended cleanup task, but no operating-system crontab is configured and the GitHub Actions trigger is failing because `HOSTINGER_SCHEDULER_URL` is empty. Recent Laravel error log entries are from an unsupported historic command option rather than a current application exception.

The available Hostinger browser session did not expose an interactive authenticated hPanel page, so the missing external scheduler trigger cannot be repaired from that session without owner access to the control panel or repository-secret settings.

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

## Constraints

No mock users, payments, content, episodes, casts, blogs, or media will be created during the audit. Backend corrections will be backed up, syntax checked, cache-cleared, and endpoint-validated before release.
