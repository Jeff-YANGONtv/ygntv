# Yangon TV Production Audit — 22 August 2026

**Scope.** This audit covers the public Vercel website, the live Hostinger Laravel API, the Premium and prepaid-access controls, and both Telegram Bot controllers. It was performed against production endpoints and live configuration without creating test users, prepaid codes, wallet balances, content unlocks, payment records, or Telegram posts.

## Production changes applied

The Laravel Admin Bot no longer sends raw PHP or database exception text to its Telegram operators when social links, TMDB shows, seasons, episodes, movies, manual shows, or blog posts fail. Each failure is now logged server-side and returns a stable recovery message to the operator. Its outbound Telegram calls now use a five-second connection timeout, bounded request timeouts, and two retry attempts for transient failures.

TMDB failure responses now use stable application error codes and human-readable messages. Provider error text and provider status are recorded only in Laravel logs; they are not included in API JSON returned to the administrative interface.

The Vercel configuration now adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a conservative `Permissions-Policy`. A restrictive Content-Security-Policy was deliberately not added because the production player can require external Nstream, YouTube, and Google Drive embeds; those dependencies require a separately tested embed inventory.

The repository now contains a five-minute GitHub Actions scheduler workflow. The workflow sends only a repository secret named `HOSTINGER_SCHEDULER_URL` to the signed Laravel scheduler endpoint; the signed URL is not stored in source control.

| Component | Change | Backup or release evidence |
|---|---|---|
| Laravel Admin Bot | Sanitized operator-visible errors and added resilient Telegram HTTP delivery settings | `storage/app/production-backups/production-audit-hardening-20260822-132500/` and `production-audit-bot-transport-20260822-133000/` |
| Laravel TMDB integration | Removed provider error and status disclosures from responses | `storage/app/production-backups/production-audit-tmdb-response-20260822-133500/` |
| Website edge configuration | Added conservative Vercel security headers | Git commits [`ff64456`](https://github.com/Jeff-YANGONtv/ygntv/commit/ff64456) and [`44497ac`](https://github.com/Jeff-YANGONtv/ygntv/commit/44497ac) |

## Verified checks

| Area | Result | Evidence |
|---|---|---|
| Frontend quality | Passed | `pnpm lint`, `pnpm build`, and `pnpm audit --prod` completed successfully; the production build still reports a non-blocking large JavaScript chunk warning of approximately 1.24 MB minified / 362 KB gzip. |
| Vercel deployment | Passed | Both Vercel deployment checks for commit `44497ac` completed successfully. |
| Website headers | Passed | Production response includes HSTS plus the four newly configured headers above. |
| Production mode | Passed | Laravel resolved `APP_ENV` as production and `APP_DEBUG` as false; no configuration values were printed. |
| Protected wallet/playback | Passed | Anonymous wallet, movie playback, and episode playback requests each returned HTTP 401. |
| Catalog media secrecy | Passed | The public movies catalog did not expose stream or download fields. |
| CORS | Passed | The production Vercel origin received the configured CORS allow-origin response; an untrusted origin received none. |
| Sensitive file shielding | Passed | `/.env`, `/composer.json`, `/storage/logs/laravel.log`, and `/.git/config` all returned HTTP 403. |
| Laravel health | Passed | The signed scheduler route is registered, PHP syntax checks passed for deployed controllers, cache rebuild completed, and `queue:failed` reported no failed jobs. |
| Scheduler endpoint | Passed locally | A signed endpoint generated on Hostinger returned `{"success":true}` when invoked locally, proving the route, signature middleware, cache lock, and scheduled command hand-off function together. |

## Remaining production items

The GitHub Action did not execute the external scheduler because the repository secret `HOSTINGER_SCHEDULER_URL` is not configured. An attempt to set that secret through the available GitHub integration was blocked with HTTP 403 for repository Action-secret administration. The workflow is otherwise valid and a manual run correctly failed closed without a secret. A repository administrator must add the signed URL to **GitHub → Jeff-YANGONtv/ygntv → Settings → Secrets and variables → Actions** as `HOSTINGER_SCHEDULER_URL`. Generate a fresh URL on Hostinger with `php artisan external-schedule:url`, paste it only into the encrypted secret field, and run **Hostinger Laravel Scheduler** once from the Actions tab. Never commit or paste that URL into a chat, source file, issue, or log.

The Nstream provider integration remains intentionally incomplete. Public Nstream embed URLs can be opened outside the Yangon TV authorization flow if known. No protected streams were extracted or bypassed. Content-level enforcement requires official Nstream API documentation and credentials that support signed/private playback URLs or allowed-domain restrictions.

The current Vite main bundle warning is a performance improvement candidate rather than a release blocker. It should be addressed later by measuring route-level imports and selectively splitting heavy player/OCR modules without disrupting authenticated playback.

## Operational conclusion

The deployed website, Laravel API, prepaid and Premium authorization boundary, and bot error-handling paths have been hardened and passed the checks listed above. The only operational blocker preventing the scheduled cleanup from running every five minutes is the missing encrypted GitHub repository secret. Until that secret is configured, the scheduler endpoint itself is healthy but will not be invoked automatically.
