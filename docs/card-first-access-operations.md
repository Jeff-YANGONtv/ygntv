# Yangon TV Card-First Access Operations

Yangon TV uses two secure, one-time card products. **Point Cards** add points to the Point Wallet of a non-Premium user. **Premium Time Cards** activate or extend Premium access for three, six, nine, or twelve months. Both card products use the same `YG-XXXX-XXXX-XXXX` code format, but their benefit is determined by the protected server-side batch type rather than by the code text.

## User access rules

| Card type | Eligible user | Result after successful redemption |
|---|---|---|
| Point Card | Non-Premium user | Adds the batch point value to the Point Wallet. Movie unlocks cost 15 Points and episode unlocks cost 5 Points. |
| Premium Time Card | Normal or active Premium user | Creates or extends Premium access by the selected card plan duration. Active Premium time is extended from the current expiry date. |

Premium users do not use Point Cards because their membership already provides unlimited access. They can redeem Premium Time Cards to extend their term. Each code is cryptographically protected, one-time-use, and non-expiring. Plaintext codes are shown to the administrator only once when a batch is generated.

## Admin Bot workflow

Open **🎟 Cards** in the Yangon TV Admin Bot. Choose **Point Card Batch** for wallet cards. Enter a batch label, the number of points per card, and the number of cards. Choose **Premium Time Batch** for membership cards. Enter a batch label, select an active Premium plan key from the Bot-provided list, and enter the number of cards.

The Bot displays the new plaintext codes once. Save or print them immediately for distribution. Do not place codes in a public message, website page, repository, or log. The Bot batch list shows the benefit type, quantity, redeemed count, and active count without exposing redeemed plaintext codes.

## Website flow

The Profile page is the Point Card redemption surface and displays Point Wallet Activity History. The Subscription page is card-first: a user enters a Premium Time Card as the primary membership method. The existing Wave/KPay/AYA Pay transfer and receipt flow remains available only after the user explicitly selects **I do not have a Premium Time Card — use bank transfer**.

Historical payment orders and receipts remain retained for existing billing records. No historical transaction, entitlement, wallet balance, or code record was deleted during this change.

## Validation boundary

The schema, API authentication boundary, backend syntax, migration status, website type check, production build, and Vercel deployment have been verified. No real card batch, redemption, point balance, user, or entitlement was generated solely for validation. Before distributing cards, generate the first real sales batch through the Admin Bot and redeem it with the intended customer account as the operational acceptance check.
