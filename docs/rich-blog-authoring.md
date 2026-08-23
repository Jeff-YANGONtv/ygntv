# Yangon TV Rich Blog Authoring Guide

Yangon TV Blog posts are now designed as structured articles rather than plain text announcements. Every published article can include a cover image, title, topic, author, publication date, accessible image description, short excerpt, SEO metadata, safe HTML content, inline images, and approved video embeds.

## Creating a post in the Admin Bot

Open **📰 Media & Blogs → ➕ Add Blog**. The Bot collects the post information in this order. The article is published only after the final meta-description step succeeds.

| Step | Required information | Guidance |
|---|---|---|
| 1 | Article title | Keep it specific and human-readable. |
| 2 | Topic | Examples: `New Releases`, `Reviews`, `Entertainment News`, or `Watch Guide`. |
| 3 | Author | Use a consistent byline such as `Yangon TV Core`. |
| 4 | Cover image URL | Provide the full `https://` image URL. A 16:9 image is recommended. |
| 5 | Cover image description | Describe the image accurately for accessibility and search discovery. |
| 6 | Article HTML | Use only the supported safe HTML listed below. |
| 7 | Excerpt | A short preview shown on Blog cards and search results. |
| 8 | SEO title | Type `same` to reuse the article title, or provide a concise search title. |
| 9 | Meta description | Write a clear summary of up to 180 characters for Google and social previews. |

## Supported article HTML

The server removes unsafe HTML automatically. Use semantic content tags for the best mobile reading experience and SEO output.

| Content | Supported tags |
|---|---|
| Paragraphs and headings | `<p>`, `<h2>`, `<h3>`, `<h4>`, `<br>` |
| Emphasis | `<strong>`, `<em>`, `<b>`, `<i>` |
| Lists | `<ul>`, `<ol>`, `<li>` |
| Quotes and code | `<blockquote>`, `<pre>`, `<code>` |
| Images | `<figure>`, `<img>`, `<figcaption>` |
| Video | `<video>`, `<source>`, YouTube/Vimeo `<iframe>` embeds |
| Links | `<a href="https://...">` only |

All image, video, and link URLs must use `https://`. The server rejects scripts, inline styles, forms, unsafe protocols, and arbitrary iframe providers. Only YouTube and Vimeo iframe hosts are allowed for embedded videos.

## Example article HTML

```html
<p>Yangon TV has selected three stories worth adding to your weekend watchlist.</p>

<h2>Why this collection works</h2>
<p><strong>Each title</strong> brings a different mood, from a quiet drama to a fast-paced thriller.</p>

<figure>
  <img src="https://example.com/weekend-watchlist.jpg" alt="Three featured films in the Yangon TV weekend watchlist">
  <figcaption>Three picks for a relaxed weekend watch.</figcaption>
</figure>

<blockquote>Good stories stay with you after the credits end.</blockquote>

<iframe
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Official trailer"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

## SEO and canonical URL behavior

Every post is published with a clean canonical URL in this form:

```text
https://ygntv.vercel.app/blog/{post-id}-{published-year}/{title-slug}
```

For example:

```text
https://ygntv.vercel.app/blog/57-2026/top-10-movies-to-watch
```

The post ID and publication year keep each URL unique without an arbitrary suffix. Existing older `/blog/{slug}` links remain readable for compatibility. The canonical URL, Open Graph metadata, Twitter card metadata, JSON-LD `BlogPosting` data, `robots.txt`, and dynamic `/sitemap.xml` are generated for search and social discovery.

## Authoring checklist

Before publishing, verify that the title describes the article, the cover image is clear, its description accurately explains the image, the excerpt is concise, the topic is relevant, the article includes readable paragraphs and headings, every linked image/video uses HTTPS, and the meta description is written for a person deciding whether to open the post.

Do not publish content that you do not have the right to use. For videos, prefer official trailers or content you own. Do not use the Blog HTML feature to embed protected playback URLs, direct Nstream sources, or any content that bypasses Yangon TV access controls.
