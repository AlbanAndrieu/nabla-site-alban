# SEO URL migration: remove `.html` canonicals

Date: 2026-08-23

## Target URL policy

Indexable pages use clean, extensionless public URLs.

- English is the default locale and has no locale prefix: `/nabla`, `/truenas`, `/expertise`.
- French uses the `/fr` prefix: `/fr/nabla`, `/fr/truenas`, `/fr/expertise`.
- Canonical URLs, `hreflang`, sitemap entries, and maintained internal links must never use `.html` for an SEO page.
- `/en/...` is not a canonical public URL while `next-intl` uses `localePrefix: "as-needed"` with English as the default locale.

This avoids performing two URL moves at once. Existing English SEO pages move from `/page.html` directly to `/page`, rather than `/page.html` to `/en/page`.

## Migrated SEO routes

| Old English URL | New English canonical | Old French URL | New French canonical |
| --- | --- | --- | --- |
| `/expertise.html` | `/expertise` | `/fr/expertise.html` | `/fr/expertise` |
| `/contact.html` | `/contact` | `/fr/contact.html` | `/fr/contact` |
| `/security.html` | `/security` | `/fr/security.html` | `/fr/security` |
| `/ai.html` | `/ai` | `/fr/ai.html` | `/fr/ai` |
| `/ciso.html` | `/ciso` | `/fr/ciso.html` | `/fr/ciso` |
| `/truenas.html` | `/truenas` | `/fr/truenas.html` | `/fr/truenas` |
| `/link.html` | `/link` | `/fr/link.html` | `/fr/link` |
| `/email.html` | `/email` | `/fr/email.html` | `/fr/email` |
| `/nabla.html` | `/nabla` | `/fr/nabla.html` | `/fr/nabla` |

The home page, CV, and Jus Mundi pages were already extensionless canonicals.

## Required invariants

For every indexable localized page:

1. `rel="canonical"` is self-referencing and extensionless.
2. `hreflang="en"` targets the unprefixed English canonical URL.
3. `hreflang="fr"` targets the `/fr/...` canonical URL.
4. The sitemap contains only canonical extensionless URLs and their localized alternates.
5. Maintained internal navigation links directly to the canonical URL, not through a redirect.
6. Historical `.html` SEO URLs use a direct permanent server-side redirect to the final canonical URL; no redirect chains.
7. Non-indexable legacy pages may retain `.html` independently until they are migrated; they must stay outside the SEO sitemap.

## Redirect lifecycle

The `.html` redirects exist for SEO signal transfer, not bookmark compatibility. Keep them for at least one year after production migration, then review Search Console and access logs before deleting them.

Do not restore `.html` URLs to the sitemap or canonical metadata during this period.

## Deployment verification

Before merge/deploy:

- production build succeeds;
- `/sitemap.xml` contains no `.html` SEO URLs;
- English canonical URLs are `/page`, not `/en/page`;
- French canonical URLs are `/fr/page`;
- canonical and EN/FR `hreflang` annotations are reciprocal;
- every migrated `.html` URL returns a permanent redirect directly to its clean counterpart;
- indexable pages remain indexable and non-SEO pages remain `noindex`.

After production deployment:

1. Submit the refreshed `/sitemap.xml` in Google Search Console.
2. Inspect representative new URLs (`/`, `/expertise`, `/nabla`, `/truenas` and their French variants).
3. Confirm Google-selected canonical converges to the extensionless URL.
4. Monitor indexing, redirect coverage, crawl errors, and organic traffic during the migration.
5. Keep redirects in place while old `.html` URLs continue to receive crawler or external-link traffic.

No Search Console Change of Address operation is required because this is a path migration on the same domain.
