# Notification Bell Validation — 2026-08-22

The signed-in header bell uses the authenticated `GET /api/tv/notifications`, `POST /api/tv/notifications/{notification}/read`, and `POST /api/tv/notifications/read-all` endpoints. Live Laravel route inspection confirmed Sanctum protection with the existing 60 requests-per-minute user throttle. The `notification_reads` migration has run in production, and the notification controller passes PHP syntax validation.

The website header already contains the signed-in-only Notification Bell with 45-second polling, unread count, per-item read handling, and mark-all-read handling. The mobile stylesheet rule was corrected to override the generic first-header-icon hiding selector. The deployed Vercel stylesheet at `https://ygntv.vercel.app/assets/index-gkyVFGB5.css` contains the corrected `.header-actions .icon-button.notification-bell{display:inline-flex}` rule.
