# Yangon TV Third-Party Keyword Audit — 23 August 2026

## Current frontend baseline

The current production frontend does **not** place `Channel Myanmar`, `Bioscope`, `HomieTV`, `MSub Movie`, or `Mya Mya` into public page titles, descriptions, headings, hidden text, canonical URLs, or generic keyword blocks. This is the correct starting point: Yangon TV’s visible interface remains focused on Yangon TV, Movies, Series, and Blog.

| Candidate term | Public research context | Frontend recommendation |
|---|---|---|
| Bioscope | Google Play identifies a `Bioscope for Mobile` app with Myanmar-subtitled international movies and series. | Do not add globally. It can appear in an accurate, factual comparison or availability guide. |
| Channel Myanmar | The examined Bioscope listing uses the package identifier `com.channelmyanmar.cmofficial`; the term is therefore associated with a third-party brand context. | Do not imply Yangon TV is affiliated. Mention only in source-supported editorial content. |
| HomieTV | Its public website presents Movies and TV Shows and says content links are supplied by third parties. | Do not add globally. A neutral guide may cite it if the content is verified and useful. |
| MSub Movie / Mya Mya | No authoritative source was verified in this audit session. | Do not target until the exact brand/entity and its search intent are verified. |

## Safe strategy

The technically correct frontend work is already in place: Yangon TV has titles, descriptions, canonicals, Open Graph data, Burmese language signals, sitemap, robots directives, and real catalog/Blog routes. The missing ingredient for third-party-brand queries is **not** a metadata keyword list; it is one useful, factually accurate, publicly visible editorial page per genuine user question.

Examples of permissible content, provided it is researched and accurate, include a neutral guide such as *“Myanmar subtitle movie platforms: what to check before watching”* or a transparent comparison of public features, availability, and lawful access. Such pages must clearly identify Yangon TV as Yangon TV, must never claim partnership or ownership of another brand, must link only to official public pages where appropriate, and must not include protected-stream URLs.

## Frontend implementation decision

No global frontend metadata, homepage copy, Movies/Series headings, navigation label, hidden element, or generic Blog page text should be changed to add these third-party names. That would be irrelevant on much of the site, would conflict with the requested clean UI, and risks becoming keyword stuffing.

The correct implementation unit is a **real Blog article**. After the article’s facts and sources are approved, the existing rich Blog system will automatically produce a dedicated canonical URL, visible heading and body content, article-specific SEO title and description, Open Graph metadata, `BlogPosting` schema, sitemap entry, and internal Blog links. No new frontend component is required.

| User query pattern | Safe article angle | Do not do |
|---|---|---|
| `Channel Myanmar` or `Bioscope` | A factual “Myanmar subtitle movie platforms: availability and access checklist” article that cites official public sources. | Claim affiliation, copy another service’s brand, or list the terms in global metadata. |
| `HomieTV` | A source-backed explainer that distinguishes official content, third-party links, and legitimate access considerations. | Link to protected streams, offer a bypass, or publish unverified claims. |
| `MSub Movie` / `Mya Mya` | Research the exact entity first, then write only if there is a relevant and verifiable topic. | Target ambiguous names with speculative or fabricated content. |

Google explicitly identifies hidden text and keyword stuffing as prohibited manipulation. Keyword lists that are repeated, unnatural, or out of context are not a compliant discovery strategy.[3]

## Sources checked

1. [Bioscope for Mobile — Google Play](https://play.google.com/store/apps/details?id=com.channelmyanmar.cmofficial&hl=en_US)
2. [HomieTV public website](https://www.homietv.com/)
3. [Google Search Central — Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
