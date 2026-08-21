# Premium Payment Method Artwork

| Method | Supplied asset URL | Verified artwork | Planned presentation |
| --- | --- | --- | --- |
| AYA Pay | https://cdn.phototourl.com/member/2026-08-21-17d7c73a-ab95-4c85-b6cf-fcc17e6c1cec.jpg | 447×447 red AYA Pay mark | Center-cropped circular logo frame |
| Wave Pay | https://cdn.phototourl.com/member/2026-08-21-07dccc38-a56c-40f9-89ba-dd44fabaf2d0.jpg | 240×240 yellow-and-blue Wave mark | Center-cropped circular logo frame |
| KPay | https://cdn.phototourl.com/member/2026-08-21-3c6180f1-040f-419f-8527-13bccd03cfe1.jpg | 447×447 blue KBZ Pay mark | Center-cropped circular logo frame |

The website should render these only when their corresponding live payment-account records are active. No payment account number, phone number, or price is stored in this asset document.

The production renderer matches each active account name to its supplied logo, keeps unrecognized account names on a letter fallback, and places every mark in the same circular frame. This means the live KPay account uses its supplied artwork immediately, while Wave Pay and AYA Pay automatically use theirs when those real accounts are activated in the admin panel.
