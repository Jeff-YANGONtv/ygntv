# Custom Yangon TV Player Validation — 2026-08-22

The Watch page now uses an application-owned player interface for direct MP4/WebM sources and HLS `.m3u8` streams. It retains the existing HLS adapter and handles loading, media/network errors, and source changes.

| Capability | Status |
| --- | --- |
| Play and pause | Custom Yangon TV control |
| Seek | Progress rail plus 10-second rewind and forward actions |
| Audio | Volume adjustment and mute |
| Playback speed | 0.75×, 1×, 1.25×, 1.5×, and 2× |
| Fullscreen | Browser fullscreen action |
| HLS sources | Existing `hls.js` integration retained |
| Motion preference | Controls and marquee-compatible styling respect reduced-motion behavior |

Provider-owned iframe sources, such as YouTube and Google Drive previews, remain provider-controlled because their embedded players do not expose universal custom controls. The website TypeScript check and production build passed, and both Vercel targets for commit `f75c673` completed successfully.

