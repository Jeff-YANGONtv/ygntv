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
