# Nstream Direct Stream Research — 2026-08-22

The public Nstream website states that it provides an Upload workflow, an Encode section, a Transcode (Streaming) section, Player Settings, and a Developer API. It also advertises generated sharing links and embed code after upload.

The public feature page documents browser-based encoding and resolution presets including 1080p, 720p, and 480p. Its Free plan lists 720p watch/encoding quality and no multi-quality encoding.

The browser session could access the public website but navigating to `/dashboard` redirected to `/login`; therefore no authenticated account-specific video details, generated links, API credentials, or output formats were inspected. The public site material reviewed does not itself document a public `.m3u8` URL format or an unauthenticated direct-MP4 URL pattern.

Sources: https://nstream.cc/ and https://nstream.cc/login

## Supplied video check

The supplied public video page uses the route `https://nstream.cc/v/C59SBGw0uDdW3b2gJKO8QYBSMWuFsSJvI9q9hhOE`. It presents file metadata for `1000031922.mp4`, including a 1280×720 resolution, a 2.2 Mbps bitrate, and a 10-second duration. It does not display an official direct-MP4 link, HLS playlist link, or download action in the public view.

The corresponding official embedded-player route is `https://nstream.cc/e/C59SBGw0uDdW3b2gJKO8QYBSMWuFsSJvI9q9hhOE`. It renders an Nstream-controlled player with its own play, 10-second seek, settings, and fullscreen controls. This confirms that the `/e/{video-id}` page is the provider embed route; it does not establish an officially supported raw `.m3u8` or MP4 URL for use outside the provider player.
