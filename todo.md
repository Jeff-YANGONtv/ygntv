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
