- [x] Add public website authentication with a reusable Login/Sign Up page and popup
- [x] Keep Movie/Series catalog and review pages public, but require authentication before entering the player
- [x] Delete the confirmed Expo/EAS Mobile project record and remaining Mobile-only cloud metadata while preserving website, Hostinger backend/database, scheduler, and Telegram bots
- [x] Delete the remaining Expo/EAS Mobile project record through the confirmed Expo dashboard operation after CLI deletion was blocked
- [x] Design and implement a public Website auth page plus responsive Login/Sign Up popup
- [x] Keep Movie/Series browsing and reviews public while gating player/watch/download entry behind authentication
- [x] Add Review Synopsis, Watch, and Download tabs with Direct and Telegram actions
- [x] Route Direct Watch and Direct Download through the authenticated Watch Page and protect Download below the player
- [x] Align backend media serialization and validation for direct streaming/download links and Telegram post links
- [x] Audit and correct the currently wrong Series posting workflow using the actual production bot handler; do not rely on guessed SERIES_ID/SEASON/EPISODE syntax
- [x] Remove the hard-coded Season 1 Episode 1-only limit so a parent Series can accept repeatable Seasons and Episodes
- [x] Audit the restored Hostinger Laravel production schema, controller, API route, and Telegram workflow before making series-management changes
- [x] Back up and validate the live Laravel deployment before reporting the repaired series and media-link flows
- [x] Refine the Review and player Back controls with polished spacing, contrast, and mobile-safe touch targets
- [x] Diagnose and repair the production Sign in / Sign up flow against the live Laravel auth API
- [x] Verify authentication error handling, successful session persistence, and protected-player access after the fix

- [x] Rename the public Review tab label from Synopsis to Review

- [ ] Reconcile the production website checkpoint metadata after the deleted mobile project was selected by the checkpoint service

- [ ] Remove stale temporary preview/debug artifacts from the website workspace after validation

- [ ] Confirm the public website build and Vercel deployment after the auth repair

- [ ] Run final production smoke tests for auth and player gating

- [ ] Ensure no secrets are exposed in source or logs

- [ ] Verify API CORS and auth token handling across browser and mobile clients

- [ ] Add a user-facing auth failure troubleshooting note to the project documentation

- [ ] Confirm the auth modal and auth page use consistent labels and behavior

- [ ] Check that Sign Up validation messages are actionable

- [ ] Check that Sign In invalid credentials show Laravel error message

- [ ] Verify logout clears token and user storage

- [ ] Verify direct /watch route remains protected

- [ ] Verify Review page stays public while direct actions are gated

- [ ] Verify Telegram post link actions remain unaffected by auth changes

- [ ] Keep website, Hostinger backend, scheduler, and Telegram bots untouched except for required auth fix

- [ ] Preserve the pre-auth-fix backup and record final validation status

- [ ] Update the final report with exact commit and deployment status

- [ ] If Vercel deployment is delayed, report the delay and provide the GitHub commit

- [ ] If Hostinger API is unavailable, report it separately from frontend validation

- [ ] Do not use mock authentication data in production code

- [ ] Ensure API errors do not leak credentials or tokens

- [ ] Ensure auth forms remain responsive on mobile

- [ ] Ensure accessible labels and focus states remain intact

- [ ] Ensure review tab label remains Review after auth changes

- [ ] Ensure public API sample attachments are still valid if referenced

- [ ] Confirm no accidental Android mobile project changes are included

- [ ] Confirm GitHub main branch contains only intended website changes

- [ ] Finalize production auth smoke-test evidence

- [ ] Close the auth regression task after deployment verification

- [ ] Do not modify Hostinger auth schema unless the live contract requires it

- [ ] Prefer smallest safe frontend fix when backend auth endpoints are healthy

- [ ] Preserve all existing media gating behavior

- [ ] Confirm direct watch and direct download both invoke the same auth gate

- [ ] Confirm auth popup close behavior remains functional

- [ ] Confirm sign-in and sign-up tab switching remains functional

- [ ] Record any remaining blocker explicitly

- [ ] Do not commit generated dist output

- [ ] Do not commit temporary preview configuration

- [ ] Do not commit unrelated untracked workspace artifacts

- [ ] Final response should summarize only verified facts

- [ ] Add no placeholder user data

- [ ] Complete the auth regression investigation
- [x] Add password confirmation to the public Sign up form and match Laravel's confirmed-password validation contract
- [x] Preserve the existing login payload and token extraction contract while fixing registration
- [x] Reproduce the deployed password confirmation mismatch and verify the exact Sign up payload
- [x] Fix any remaining confirmation field state or payload mismatch and revalidate production registration
- [x] Reproduce the post-auth redirect delay and identify why a manual refresh is currently needed
- [x] Repair immediate AuthProvider state propagation and redirect behavior after Sign in and Sign up
- [x] Verify protected player access unlocks immediately without a refresh
- [x] Show a clear success popup after successful Sign up and Sign in before redirecting
- [x] Keep the new auth session active while success feedback and redirect complete
- [x] Audit the current Sign up password and Confirm password validation behavior
- [x] Harden local mismatch validation and confirm the Laravel password_confirmation payload
- [x] Build and verify the corrected Sign up validation in production
- [x] Audit the live auth user contract and available premium/purchase-history endpoints for Profile data
- [x] Build the authenticated Profile page with username, badge, premium state, remaining term, purchase history, and Log Out
- [x] Move Sign in/User profile access into the menu profile entry and remove account text from the notification area
- [x] Build and verify responsive Profile navigation using live data only
- [x] Reproduce the missing Sign up success popup or automatic redirect
- [x] Make registration success feedback and redirect reliable after the Laravel response
- [x] Build and verify the corrected Sign up completion flow in production
- [x] Audit why authenticated Profile data may not be visibly rendering for username, badge, premium status, and purchase history
- [x] Correct live profile normalization and loading/empty/error states without mock values
- [x] Build and verify the authenticated Profile display in production
- [x] Remove the notification bell, blog notification polling, and notification popover while keeping Blog navigation intact
- [x] Build and verify the simplified website header in production
- [x] Replace the main menu entries with User Profiles, About Us, Links, and Premium Subscription
- [x] Move the menu icon to the right side of the header and keep the header navigation sticky
- [x] Build and verify the simplified sticky menu in production
- [x] Show Sign In / Sign Up in the menu before authentication and user-profile access after authentication
- [x] Rename the menu and subscription-page label from Premium Subscription to Premium
- [x] Set the menu to Sign In / Sign Up, Subscription, Links, and About Us only
- [x] Set the bottom navigation to Home, Movies, Series, Blog, and About Us
- [x] Build and verify the final menu and bottom navigation labels in production
- [x] Audit Laravel blog, user-profile, reaction, comment, and sharing data support
- [x] Add secure live Blog reactions for Love, Like, Haha, and Angry
- [x] Add text-only Blog comments gated by sign-in and linked to commenter profiles
- [x] Add Blog sharing and responsive interaction controls without mock data
- [x] Restrict Blog sharing controls to Telegram, Facebook, and TikTok with a device-share fallback for TikTok
- [x] Build, deploy, and verify the complete Blog interaction flow
- [x] Audit live premium plans, payment accounts, receipt upload, and approval contracts
- [x] Render 3/6/9/12-month panel-controlled packages in a 2×2 grid and payment methods in a 3-column grid
- [x] Build authenticated payment selection, payment account copy controls, slip upload, and automatic receipt-number extraction
- [x] Submit the selected live plan and payment method for admin proof review, then show a 5-second confirmation before returning Home
- [ ] Build, deploy, and verify premium activation after admin approval
- [x] Seed panel-controlled Premium plans: 3 Months 3,000 Ks; 6 Months 5,000 Ks; 9 Months 7,500 Ks; 12 Months 10,000 Ks
- [x] Store and display supplied AYA Pay, Wave Pay, and KPay payment method artwork through live payment-account records
- [x] Present each supplied payment method logo inside a polished circular frame
- [x] Show the panel-controlled payment Account Name as the first receipt-page field without a copy control
- [x] Show the signed-in account name in the header profile tab instead of the generic User Profile label
- [x] Style the account tab red with white text, other header menu tabs black with red text, and the active tab with a clear illuminated state
- [x] Keep the header navigation sticky across all public website routes
- [x] Replace Bottom Nav About Us with a Menu control that opens a polished drawer-style navigation panel
- [x] Remove the drawer Links tab and show Facebook, TikTok, and Telegram beneath About Us using the existing live Social Links API
- [x] Replace the drawer Links position with a Contact Us page entry
- [x] Add a Contact Us “Who Are U?” first step with Ads Partner/Client, Subscribers, Job Applier, and Collaborative Partner options
- [x] Add panel-controlled Telegram and Viber destinations for each of the four Contact Us audiences
- [x] Show a “Thanks For Choosing Us” popup with Telegram and Viber icon buttons after an audience is selected
- [x] Replace the current Home page sections with live 728×300 header, blog, trending-movie, series, and footer banner sliders
- [x] Remove the Header Nav Menu tab while retaining a clear mobile navigation path
- [x] Change the drawer header greeting from “Yangon TV menu” to “Welcome To Yangon TV”
- [x] Add panel-controlled Ads API placements for Home header and footer 728×300 banner sliders
- [x] Audit and repair the admin bot panel and Public View bot menu, callbacks, media navigation, and post-link flows
- [x] Complete a project-wide production readiness audit across website, Laravel API, payment flow, authentication, admin bot, Public View bot, and deployment configuration
- [x] Apply only validated production-safe fixes and document any remaining panel configuration inputs
- [x] Add admin bot controls for active Home header and footer Ads API banners
- [x] Add and backfill a registration-date-derived UID for every user account, then expose it in account/profile data
- [x] Add autoplay to live Home sliders and present Trending Movies and Popular Series in responsive 16:9 banner cards
- [x] Rename the Review tab content from Synopsis to Review and show rating, release year, genre, and Yangon TV Production Unit credit beneath each movie title
- [x] Add a signed-in-only header notification bell backed by live user-specific notifications, unread counts, and read-state APIs
- [x] Replace opaque public content slugs with clean human-readable URLs while preserving existing shared links where feasible
- [x] Document the verified Admin Bot workflow for creating a series and repeatedly adding seasons and episodes
- [x] Render Facebook, TikTok, and Telegram using their official brand icons in the live social-link UI
- [x] Keep the primary Header Navigation sticky and visibly layered above page content while scrolling
- [x] Diagnose and repair the production sign-in failure that currently shows a generic unavailable message
- [x] Simplify and repair the Admin Bot Series workflow for adding a series with multiple seasons and episodes
- [x] Show exactly one Account Name and one Account Number for each Premium payment method, with no duplicate account-number prompt or field
- [x] Repair the Admin Bot rate-limit behavior so legitimate management actions are not blocked
- [x] Verify the live Premium payment API and page show correct Account Name and Account Number values without duplication
- [x] Generate user-specified Telegram captions automatically for Movie files and Series episode files
- [ ] Replace the website Watch Now label with ➤ ကြည့်ရှုရန် while retaining its existing playback behavior
- [x] Remove the forced subscription requirement from the Public Telegram Bot while retaining direct user access and media delivery
- [x] Add the three user-provided external Telegram buttons beneath every Public Bot video delivery
- [x] Update Movie and Series episode delivery captions to the revised labeled multiline format with full release dates
- [x] Replace the three Public Bot video delivery buttons with the single user-provided Join button
- [x] Diagnose and correct the Premium payment page Account Name fallback showing “Not supplied”
- [x] Restore and verify the signed-in Notification Bell with live unread and read-state APIs
- [x] Add threaded Blog comment replies and notify the original commenter through the Notification Bell
- [x] Add a panel-controlled scrolling marquee announcement to the website Header Bar
- [x] Build a branded custom Yangon TV video player UI for current and future Cloud streaming sources
- [x] Document verified Nstream direct MP4 or HLS stream access options for the custom player
- [ ] Deferred: Bunny Stream secure playback rollout unless the owner reselects Bunny; do not bypass protected Nstream streams
- [x] Evaluate Cloudflare Stream, Bunny Stream, and Mux and recommend Bunny Stream as the official non-Nstream platform for Yangon TV custom-player integration
- [ ] Create and configure a Bunny Stream Video Library after the owner confirms the recommended provider and account setup
- [ ] Guide the owner through Bunny Library creation, HLS-only 360p/720p settings, and first owner-authorized video upload
- [ ] Build a restricted Telegram Bot workflow that uploads owner-authorized video files to Bunny Stream and returns the Bunny Video ID
- [x] Add a per-title playback-source selector so each Movie or Episode uses either an authorized Embed source or Bunny signed HLS custom playback, never both at once
- [x] Permit Custom Embed source URLs from any provider without a fixed domain allowlist, while requiring valid HTTPS URLs and safe iframe rendering
- [ ] Use owner-authorized Nstream.cc iframe/embed URLs through the existing Custom Embed mode; do not extract or transform protected streams
- [x] Optimize the Custom Embed iframe frame for Nstream mobile playback with a stable 16:9 ratio, full-width layout, rounded clipping, and safe overflow handling
- [ ] Verify the responsive frame with an owner-authorized live Nstream iframe embed on a mobile device without altering provider controls
- [x] Add explicit Movie and Episode playback metadata for `custom_embed` and `bunny_stream`, preserving legacy streaming links for existing titles
- [x] Update the Admin Bot to select Custom Embed or Bunny Stream and collect only the relevant URL or Bunny Video ID
- [x] Update protected playback responses and the website player to select the chosen source type without access-rule bypass
- [x] Set Yangon TV custom-player speed choices to 1.5×, 2×, 2.5×, and 3×, and retain 10-second previous/next seek controls
- [x] Label Bunny custom-player quality options as Auto, SD (360p), and HD (720p), without showing raw resolution labels in the UI
- [x] Fix the Review-to-player back-navigation loop by routing Review Back to the relevant Movies or Series catalogue
- [x] Verify and repair the deployed Series review/player flow so users can visibly select a Season, then an Episode, before using that episode’s Watch or Download source
- [ ] Replace the Direct Watch YT marker with the Yangon TV brand icon
- [x] Restore the Series cast metadata workflow through Admin Bot manual entry, TMDB ingestion, and existing-Series editing; do not create mock cast records
- [ ] Add owner-authorized cast names to existing Series records, including Human Vapor, through the Admin Bot and verify them on the live review page
- [x] Verify the selector with a real published Series Season and Episode after the owner adds real episode data through the Admin Bot; do not create mock media
- [ ] Provide the owner a verified step-by-step Admin Bot workflow for adding real Seasons and Episodes to an existing Series
- [ ] Configure Bunny secrets and activate short-lived signed HLS only after the owner creates the Bunny Stream Video Library
- [ ] Validate one owner-authorized Bunny HLS video without VPN from available Myanmar mobile or ISP networks before production rollout
- [x] Deploy the validated player source-model changes through the owner-authorized Hostinger SSH session only after creating a dated production backup
- [x] Prepare Bunny Stream monthly budget scenarios and cost-control guidance using official current published rates
- [x] Verify Bunny Stream’s official billing treatment for generated adaptive renditions versus the uploaded source file
- [x] Add a prepaid-code point wallet and pay-as-you-watch billing option alongside Premium membership
- [x] Set the prepaid wallet conversion rule to 1 Ks = 1 Point
- [x] Set pay-per-title charges to 15 Points per Movie and 5 Points per Series episode
- [x] Allow Premium members to redeem prepaid codes into the same Point Wallet
- [x] Confirm that active Premium members watch unlimited without prepaid-code redemption; prepaid codes serve non-members only
- [x] Set prepaid title unlocks to remain available for at least three months
- [x] Set the prepaid-code distribution format to Admin Bot-generated `YG-XXXX-XXXX-XXXX` batches
- [x] Show active Premium members their remaining membership time instead of a Point Wallet balance
- [x] Require prepaid codes to be secure random one-time-use values with no expiry date
- [x] Move Profile Log Out to the page bottom and rename Premium navigation to Subscription with Monthly Payment and Billing subcategories
- [x] Complete a production-stage audit, hardening pass, and validation for website, Laravel APIs, payment/wallet access, and Telegram bots
- [ ] Perform a renewed end-to-end production audit of frontend UI, mobile flows, auth, player, APIs, Laravel backend, Admin Bot, data integrity, security, and deployment; fix only verified defects with backup-first safeguards
- [ ] Configure the encrypted GitHub Actions `HOSTINGER_SCHEDULER_URL` repository secret and confirm the five-minute Hostinger scheduler workflow succeeds
- [x] Add authenticated user Activity History for Point Wallet credits, debits, redemptions, and content unlocks
- [x] Limit Notification Bell delivery to user-specific transactional events: reply alerts, Premium activation, and wallet redemption
- [ ] Add opt-in series subscriptions before delivering recipient-specific new-episode Notification Bell alerts
- [x] Complete final production validation for Point Wallet Activity History and transaction rendering
- [ ] Add secure prepaid card types for Point Wallet credits and Premium Time membership activation or extension
- [x] Remove Point Wallet money-transfer and receipt-payment interfaces in favor of redeemable Point Cards
- [ ] Make Premium Time Cards the primary membership flow while retaining bank transfer, receipt-upload, payment-order, and approval as a Premium-only fallback; keep Point Wallet card-only
- [x] Correct Profile access messaging: Point users show point balance and 5-point minimum access state; Lifetime/Premium users show remaining membership time only
- [x] Remove Point conversion and unlock-price copy from the Profile Point Wallet card, retaining only balance and secure code redemption
- [x] Rebuild the Subscription page with Membership and Points sections only; do not change Profile navigation for this request
- [x] Build a responsive 1–12 month Membership package table with the specified prices and Premium Time Card redemption UI
- [x] Build a Subscription-page Points section showing 1 Ks = 1 Point, Movie = 50 Points, Episode = 25 Points, and Point Card redemption UI
- [x] Remove all Bank Transfer, receipt-upload, and fallback payment controls from the Subscription page; retain card redemption only
- [x] Show Registration Date in the Point Access card and Linked Email in the Point Wallet card instead of redundant helper copy
- [x] Keep every Membership table price and Ks suffix on one line across mobile layouts
- [x] Keep Membership card-redemption headings on one line by reducing mobile type scale rather than wrapping text
- [x] Audit and correct unintended mobile text wrapping across key Yangon TV website pages
- [x] Replace the Contact page “Who Are U?” heading with “Contact Us” while preserving audience selection options
- [x] Add structured Blog fields for cover, title, topic, publication date, author, inline photos/videos, safe HTML article content, SEO title, meta description, canonical URL, Open Graph image, and article structured data
- [x] Change canonical Blog URLs to /blog/{post-id}-{published-year}/{title-slug} while preserving legacy slug links
- [x] Validate the first real rich Blog post through the Admin Bot, including cover, embedded media, SEO preview, and its generated canonical URL
- [ ] Add server-rendered or pre-rendered per-article metadata for maximum social-crawler and no-JavaScript SEO coverage
- [x] Remove the public About Yangon TV page and all header, menu, footer, and internal navigation references
- [x] Remove duplicated Point-balance labels from Profile; show Point or Lifetime identity once and show only the appropriate supporting detail
- [x] Add and validate a Header Banner destination Link URL field in the admin workflow and public banner click handling
- [x] Enhance the supplied Yangon TV logo into a crisp site icon and browser favicon, then install and validate the production branding assets
- [x] Audit Google indexability, current titles/descriptions, language signals, and sitemap coverage for Myanmar entertainment discovery
- [x] Implement compliant Myanmar-language keyword landing content and SEO metadata for Yangon TV discovery searches
- [x] Prepare Google Search Console verification and sitemap-submission instructions for the site owner
- [ ] Verify the Yangon TV property in Google Search Console, submit the live sitemap, and monitor initial query/indexing data
- [x] Remove the visible SEO discovery section and restore the prior Movies, Series, and Blog headings while retaining non-visual SEO metadata and favicon assets
- [x] Keep the public Blog page heading and label as plain “Blog” after the visual rollback
- [x] Audit frontend metadata and content for compliant editorial targeting of relevant third-party entertainment-brand search terms
- [x] Implement the approved no-global-keyword policy without restoring removed SEO UI blocks
- [ ] Publish a source-reviewed, genuinely useful third-party platform guide only after its topic, facts, and references are approved
- [x] Draft and deliver an official About Yangon TV Blog post with SEO metadata and safe HTML, without restoring the removed About page
- [x] Generate and deliver a 16:9 official Yangon TV cover image for the About Yangon TV Blog post
- [x] Convert the official About Yangon TV Blog post and its publishing fields fully into Burmese
- [x] Generate a mobile drawer-menu visual preview with User Profile, User History, Subscription, Contact Us, Follow Us, and Log Out as separate items
- [x] Implement the simplified live drawer navigation and show User Profile when signed out or the authenticated account name when signed in
- [x] Add a real Watch History source and a combined User History view alongside existing Balance and Comment History records
- [x] Redefine User History as Watch History, Balance History, and Comment History only; exclude User Dashboard and redemption controls from that flow
- [x] Validate the new User History tabs with the first real signed-in account that has watch, balance, or comment activity; do not create test records
- [x] Execute the active real-account User History validation session without creating watch, balance, or comment test data
- [x] Review and consolidate the remaining active Yangon TV production tasks, excluding stale historical tracker entries
- [ ] Verify the active Hostinger Laravel Scheduler workflow’s next successful run; GitHub secret values cannot be inspected through the current integration
- [x] Push a clean Laravel API, Admin Panel, and Telegram Bot monorepo backup to `Jeff-YANGONtv/ygntv-backend-official`, excluding `.env`, tokens, runtime files, and database data
- [ ] Rotate the Hostinger SSH password shared during troubleshooting and replace password-based maintenance access with an SSH key
- [x] Repair clean public Movie and Series detail slugs without falling back to catalogue pagination, using exact canonical lookup followed by the documented generated-suffix format only
- [x] Remove stream, download, provider, and Telegram delivery paths from public Movie and Series detail payloads while retaining authenticated playback access
