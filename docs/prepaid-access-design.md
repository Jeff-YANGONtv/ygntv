# Yangon TV — Premium Membership and Prepaid Point Access Design

## Product model

Yangon TV will offer two separate paid access methods. A user may hold only the entitlement that applies to their current viewing action; the system must never deduct wallet points from an active Premium member.

| User access type | How access is obtained | Viewing rule | Charge rule |
| --- | --- | --- |
| **Premium Membership** | Existing 3/6/9/12-month Premium package | Unlimited access while the Premium entitlement is active | No prepaid code and no point deduction |
| **Prepaid Point Access** | Redeem a one-time prepaid code | Unlock a specific Movie or Series episode | Movie: **15 Points**; episode: **5 Points** |

The prepaid conversion is fixed at **1 Ks = 1 Point**. A user who redeems a 1,000 Ks code receives 1,000 Points. A prepaid content unlock expires at **three calendar months** after successful purchase. The purchase remains available without another charge until the unlock expires.

## User experience

Non-Premium users receive a Wallet section in their Profile. It displays the live Point balance, a secure code-redemption field, recent transactions, and a list of unlocked titles with their expiry date.

When a non-Premium user chooses to watch a Movie or Series episode, the website checks in this order:

1. An active Premium entitlement grants immediate unlimited playback.
2. An active prepaid unlock for that exact Movie or episode grants immediate playback without another charge.
3. Otherwise, the user sees a confirmation sheet that states the price: **15 Points** for a Movie or **5 Points** for an episode.
4. On confirmation, the backend atomically verifies the balance, deducts the price, creates an unlock expiring three calendar months later, and returns playback access.
5. If the balance is insufficient, the user is taken to Wallet code redemption instead of the video player.

The purchase confirmation is deliberate: opening a detail page, previewing a trailer, changing sources, or refreshing the page must not charge the user.

## Prepaid code administration

The Admin Bot will receive a **Point Wallet** manager. An administrator can generate a batch with a denomination, count, and label. Codes use the format `YG-XXXX-XXXX-XXXX`; random characters exclude ambiguous characters such as `O`, `0`, `I`, and `1` where practical. A generated code never expires, but it can be redeemed exactly once or revoked by an administrator.

The code batch is shown or exported to the administrator one time at generation. The database does not retain recoverable plaintext codes. Administrators can later view batch totals, redemption counts, revoked codes, and the user/time associated with a redemption, but not expose already-generated secret codes again.

## Data model

| Record | Essential fields | Purpose |
| --- | --- | --- |
| `point_wallets` | `user_id`, `balance_points` | Current balance for each non-Premium user's wallet |
| `prepaid_code_batches` | `label`, `points_per_code`, `quantity`, `expires_at`, `created_by` | Admin-generated code batch metadata |
| `prepaid_codes` | indexed keyed fingerprint, password hash, points, status, batch, redemption details | One-time code validation without storing usable plaintext codes |
| `point_wallet_transactions` | `wallet_id`, immutable type, delta, balance-after, reference, metadata | Auditable ledger for every credit, debit, refund, and adjustment |
| `content_unlocks` | `user_id`, media/episode reference, price, unlocked-at, expires-at | Prevents another charge for the same content during the three-month period |

Wallet changes must occur in one database transaction using a row lock. The server will never trust a point balance, content price, unlock status, or entitlement value supplied by the browser.

## Security and abuse controls

Prepaid codes are normalized before validation and stored as a keyed lookup fingerprint plus a strong one-way hash. A code can be redeemed only once. Invalid redemption attempts and generated-code operations will use rate limits and audit logging. Each completed purchase creates an immutable ledger entry that links to its content unlock.

The endpoint must evaluate Premium status first. Active Premium members receive `premium` access and no wallet transaction is created. If Premium expires, the same signed-in user can continue with the prepaid wallet method.

## Nstream delivery requirement

The wallet can gate access to Yangon TV's Watch page immediately. However, a public Nstream `/v/...` or `/e/...` URL can be opened outside Yangon TV and would bypass point charging. For the pay-per-title model to protect the video itself, Nstream must offer one of the following official controls:

1. Private or signed playback URLs issued only after Yangon TV confirms an entitlement.
2. Allowed-domain/referrer restrictions that limit playback to Yangon TV.
3. An official API that returns short-lived HLS or MP4 playback URLs.

Until one of these is enabled, the prepaid system can protect the Yangon TV interface but cannot prevent someone who already has the direct Nstream public link from opening it directly.

## Implementation order

1. Database migration and Laravel models for wallet, codes, ledger, and unlocks.
2. Authenticated Laravel APIs for wallet balance, code redemption, access checking, and purchase confirmation.
3. Admin Bot batch-code generator, revocation, and redemption audit screens.
4. Website Profile Wallet, redeem flow, purchase confirmation, and My Unlocks interface.
5. Watch-page entitlement gate and automated tests for concurrent redeems, no double debit, Premium precedence, and three-month unlock expiry.
6. Official Nstream access protection when the provider API/settings are available.
