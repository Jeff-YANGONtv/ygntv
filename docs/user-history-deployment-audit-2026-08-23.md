# User History Deployment Audit — 23 August 2026

## Verified existing real-data sources

| User History tab | Existing authenticated source |
|---|---|
| Watch History | `GET /tv/library/history` backed by `TvViewingProgress` records |
| Balance History | `GET /tv/wallet/activity` backed by wallet transactions |
| Comment History | Requires the new authenticated endpoint built from the user’s existing Blog comment records |

No synthetic history records will be created. The Profile page redemption control and embedded wallet/billing history panels are being removed from the user-facing profile so that the separate User History page owns the three requested categories.

## Production deployment access

The existing key-based SSH connection is not authorized. The Hostinger control-panel page did not render an authenticated session in the current browser. A production Laravel deployment will not be attempted until a secure, backup-capable access path is available.
