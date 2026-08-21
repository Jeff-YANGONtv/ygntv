# Live Profile API Audit

Source: `https://khaki-yak-457838.hostingersite.com` Laravel API, inspected over authenticated SSH on 2026-08-21.

The protected API group uses `auth:sanctum`. The relevant routes are:

- `GET /api/tv/profile` — returns `success`, `message`, and `data` containing `user`, `profile`, `entitlement`, `linked_providers`, and active `devices`.
- `PUT /api/tv/profile` — updates `display_name`, `avatar_url`, and selected preferences.
- `GET /api/tv/entitlement` — protected current entitlement endpoint.
- `GET /api/tv/payment-orders` — protected paginated purchase/order history endpoint.
- `GET /api/tv/premium-plans` — public premium plan list.

The profile response user fields are `id`, `name`, `email`, and `role`. The profile object is a `TvProfile` model with at least `display_name`, `avatar_url`, `preferences`, and timestamps. The entitlement payload is live-data-safe and returns either `{active:false, plan_key:null, plan_label:null, valid_from:null, valid_until:null}` or `{active:true, plan_key, plan_label, valid_from, valid_until}`. The purchase history payload contains paginated order rows with `id`, `reference`, `purpose`, `plan_key`, `amount_ks`, `status`, `upload_expires_at`, `receipt_uploaded_at`, `reviewed_at`, `review_note`, `created_at`, and `payment_account` details.

No mock profile or premium values should be introduced. The website must use the authenticated Laravel token in the existing Axios interceptor.
