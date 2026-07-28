---
name: next-migrate-locale-pages
description: Migrate localized static or legacy HTML pages into Next.js App Router locale routes while preserving content, SEO, shared navigation, styles, links, scripts, and legacy URLs. Use for public/*.html plus localized public HTML trees, duplicated app/en and app/fr routes, inconsistent locale headers or breadcrumbs, incomplete static-to-Next migrations, rendering regressions after migration, or Turbopack file-tracing warnings caused by loading legacy files.
---

# Migrate localized pages to Next.js

Migrate pages into `app/[locale]/<route>/page.tsx` without losing information or treating a successful compile as proof of parity.

---

## IMPORTANT: i18n message file update best-practices

**Never overwrite the global translation file!**

When adding translations for a specific page:
- Always parse the existing `messages/en.json` and `messages/fr.json` in full, and MERGE or APPEND only the key you want to add or update (i.e. `"email"` or `"ctid"` or `"pricing"`) for your new/migrated page.
- Never overwrite or truncate other translation keys/sections unrelated to the page. These JSON files are _global registries_ for all locale strings (used by all pages and components).
- You must use a workflow that always reads and merges the full file before writing.
- **The official and ONLY supported tool for manipulating these JSON files in this repository is the script:**
  ```
  node scripts/merge-i18n-message.js messages/en.json patch.json
  ```
  where `patch.json` contains only the key(s) you want to ADD/UPDATE (example: `{ "404": { ... } }`).
  This script guarantees a deep merge and preserves all other i18n blocks.
  All automation or human intervention must use this script for i18n append/merge.
- All automation/scripts must do a read-modify-write (append not replace).

**Rule:**
> Any script, manual edit, or automation must only update the subtree relevant to the page/component being migrated and must NEVER destroy or replace the other data of the file.

This prevents breakages of translations on the entire site and guarantees that every page, old et nouvelle, conserve leur accessibilité multilingue.

If unsure: always review via diff or use a YAML/JSON linter/hook in your workflow.

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

### KEY RULE FOR TRANSLATION FILES (messages/en.json, fr.json, …)

Whenever you add a new page, translation key, or migrate an additional block, you **must** always:
- Parse and merge the *entire* translation file,
- Append/merge only the relevant page/block/key,
- Never remove, overwrite, or truncate any other unrelated translation data in the file.

This guarantees all legacy translations, page blocks, UI sections, or components remain available, and makes all batch/script/manual edits safe.

If you update messages via script, add a review/validation that diffs before/after: every unrelated translation key should remain unchanged.

Copy this rule to any migration skill, migration README, or onboarding doc as a contract for anyone performing translation or migration work.

---
