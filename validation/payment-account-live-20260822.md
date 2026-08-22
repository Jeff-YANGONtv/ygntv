# Premium Payment Account Validation — 2026-08-22

The Vercel production API proxy returned the live payment-account values required by the payment page. The frontend mapper now preserves `account_name` instead of dropping it before the selected account reaches the payment step.

| Payment method | Account Name | Account Number |
| --- | --- | --- |
| Kpay | U Htay Lwin | 09258003137 |
| Wave Pay | U Htay Lwin | 09258003137 |
| AYA Pay | Zin Ko Ko Lwin | 09880598667 |

The website TypeScript check and production build passed. Both Vercel deployment targets for commit `6c268ac` completed successfully.

