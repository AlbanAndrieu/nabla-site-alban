---
name: next-migrate-locale-pages
description: Migrate localized static or legacy HTML pages into Next.js App Router locale routes while preserving content, SEO, shared navigation, styles, links, scripts, and legacy URLs. Use for public/*.html plus localized public HTML trees, duplicated app/en and app/fr routes, inconsistent locale headers or breadcrumbs, incomplete static-to-Next migrations, rendering regressions after migration, or Turbopack file-tracing warnings caused by loading legacy files.
---

# Migrate localized pages to Next.js

Migrate pages into `app/[locale]/<route>/page.tsx` without losing information or treating a successful compile as proof of parity.

---

## Migration traps: rewrites, redirects & legacy HTML

**Always check for rewrites or redirects that might shadow your React app with static HTML or legacy content!**

### 1. Identify legacy URL rewrites and static fallbacks

- Examine `vercel.json`, `next.config.mjs` and project config for any rewrites or redirects like:
  - `{ "source": "/jm", "destination": "/jm/index.html" }`
  - `/{slug}.html -> /[locale]/{slug}` or inverse
  - Marketing, policy, or home rewrites like `/policy/*`, `/ai.html`, `/cancel.html`, `/index.html`, etc.
  - Fallbacks from `/[slug]` to `/[slug].html`, sometimes applied after migration

**Impacts:**
- URLs such as `/ai.html`, `/jm`, `/policy/xxx`, etc. may display a static HTML page, even if a real React Next.js route exists.
- Debugging or editing public/index.html or other static HTML has NO effect if a React route now takes precedence
- Maintenance is dangerous: the legacy page may still be served for some URLs (intended and unintended!)

### 2. Checklist before touching static or legacy files

- **If React code exists in `app/[locale]/...`, never update the static HTML!**
- **If a test/CI or review mentions a regression or layout bug, start by verifying which URL handler (static or React) serves the route** — by removing or commenting any rewrites/redirects for that slug in Next.js/production config.
- **If the page is covered by a rewrite that points it to `/public/*.html` or a legacy file, migrate this rewrite only after React parity is confirmed.**

### 3. Cleanup after migration

- Once a route is fully migrated and parity confirmed, **remove all rewrites/redirects** for that route (`next.config.mjs`, `vercel.json`) to:
  - Avoid serving legacy HTML
  - Prevent future confusion for developers
  - Ensure canonical URLs serve the React app

**Never keep both a live rewrite and a migrated React route for the same slug!**

---

## Migration process (core)

1. Read repository instructions, especially `AGENTS.md`.
2. Before editing Next.js code, read the relevant installed documentation under `node_modules/next/dist/docs/`. Treat it as the source of truth for the installed version.
3. Identify:
   - supported locales and default locale;
   - routing/proxy/rewrites behavior;
   - source HTML for every locale;
   - shared layout chrome already supplied by Next.js;
   - stylesheets, scripts, metadata, JSON-LD, assets, forms, and anchors used by the page;
   - canonical and legacy URLs that must keep working.
4. Record a parity baseline before coding. At minimum compare section headings, section/card counts, IDs, links, images, forms, metadata, and structured data across locales.

Do not delete or move legacy files merely because migration is requested. They may remain the content source, fallback, or legacy URL target. Remove them only when the requested cutover makes that safe and references have been audited.

## Choose the migration model

Use the least complex model that preserves maintainability and parity.

### Native React and message catalogs

Prefer native components plus `messages/<locale>.json` when the page is actively maintained, structurally shared across locales, or requires React behavior. Keep one component tree and localize copy; do not maintain large `if (locale === "fr")` JSX branches.

### Server-side legacy adapter

Use a server-side HTML loader when large translated documents already exist and must remain authoritative during an incremental migration. Extract the complete required region instead of manually recreating a shortened page.

Accept explicit extraction modes such as:

- `main`: inner `<main>` content;
- `mainOuter`: `<main>` including its wrapper;
- `headerMain`: hero/header plus main;
- `navHeaderMain`: breadcrumb/navigation, hero/header, and main;
- `body`: body content only, excluding chrome already rendered by Next.js.

Choose the mode from the actual document structure. Verify that nested elements or multiple `<main>` tags do not make a regular-expression extractor truncate content. Use a real HTML parser when structure is not tightly controlled.

Never inject untrusted HTML with `dangerouslySetInnerHTML`. A legacy adapter is acceptable only for repository-controlled content, with scripts removed or handled separately.

## Implement the route correctly

_For current App Router versions, treat `params` as asynchronous:_

```tsx
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // Resolve metadata from messages or the localized source.
  return {};
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(["en", "fr"], locale)) notFound();
  // Render native localized components or trusted extracted content.
}
```

Adapt locale validation to the repository's routing configuration. Call `setRequestLocale(locale)` when required for static rendering with the installed i18n library.

Use the App Router metadata API. Do not use `next/head`. Preserve localized title, description, canonical URL, Open Graph data, alternates, and JSON-LD where applicable.

Keep shared navigation, footer, consent UI, analytics, and widgets in their existing layout or shared component. Include page-specific navigation or calls to action when they are part of the reference page rather than global chrome.

---
