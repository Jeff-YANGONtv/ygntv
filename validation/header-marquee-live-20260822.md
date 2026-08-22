# Header Marquee Validation — 2026-08-22

The production Admin Bot controller now includes the `📣 Header Marquee` management entry, the `➕ Add Marquee Text` action, active/inactive toggles, deletion controls, and ordered announcement storage using the existing Ads records with `position=header_marquee`.

The public feed at `/api/public/ads?position=header_marquee` returned successfully through the Vercel proxy with zero current announcements. The website intentionally renders no marquee until an administrator creates an active announcement; no placeholder or mock announcement was inserted.

The Header marquee renderer fetches that live feed, displays active entries above the sticky navigation bar, scrolls duplicated text continuously, and respects reduced-motion browser settings.
