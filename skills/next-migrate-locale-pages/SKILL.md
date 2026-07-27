---
name: next-migrate-locale-pages
description: Migrate localized static or legacy HTML pages into Next.js App Router locale routes while preserving content, SEO, shared navigation, styles, links, scripts, and legacy URLs. Use for public/*.html plus localized public HTML trees, duplicated app/en and app/fr routes, inconsistent locale headers or breadcrumbs, incomplete static-to-Next migrations, rendering regressions after migration, or Turbopack file-tracing warnings caused by loading legacy files.
---

# Migrate localized pages to Next.js

Migrate pages into `app/[locale]/<route>/page.tsx` without losing information or treating a successful compile as proof of parity.

## Establish the contract

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

For current App Router versions, treat `params` as asynchronous:

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

## Centralize localized route navigation

Render one shared route header from `app/[locale]/layout.tsx` instead of rebuilding breadcrumbs and language selectors in every page. Let the header:

- hide itself on the locale root when the homepage has its own navigation;
- link to the localized homepage with an accessible home icon and visible label;
- derive the logical parent from the route segments for nested routes such as `jm/review` or `cv/document`;
- show the parent link only when a parent below the locale root exists;
- preserve the current route when changing locale, including a visible legacy `.html` suffix when rewrites keep that URL public;
- remain responsive and keyboard accessible.

Compute navigation from the current pathname, not browser history. “Parent” means the containing route directory, so it remains deterministic after direct entry or page refresh.

Put optional controls behind one centralized flag, for example:

```ts
const languageSwitcherEnabled =
  process.env.NEXT_PUBLIC_ENABLE_LOCALE_SWITCHER !== "false";
```

Do not scatter the flag across pages. Removing or disabling locale switching later should require one configuration change.

After adding the shared header:

- remove route-local language selectors and breadcrumbs;
- strip legacy `<nav class="page-nav">` elements from trusted HTML fragments before injection;
- retain only navigation that is genuinely part of the page content;
- avoid duplicate element IDs for selects and labels;
- keep locale switching compatible with both extensionless App Router URLs and rewritten `.html` URLs.

Never render a second `<html>`, `<head>`, or `<body>` from a nested layout. Return a wrapper element and let the root layout own the document. Apply legacy body classes to the wrapper and adapt scoped CSS as needed.

## Preserve localized content

- Resolve `public/locales/<locale>/<file>` first and fall back to the default source only when the localized file is absent.
- Compare every locale independently; translated pages often diverge structurally.
- Preserve semantic landmarks, heading order, IDs, ARIA relationships, asset paths, external-link safety, and form behavior.
- Rewrite relative asset URLs to root-relative URLs when the App Router route depth changes.
- Rewrite internal `.html` links through one tested helper. Preserve query strings and fragments, avoid duplicate locale prefixes, and map `index.html` to its directory route.
- Do not silently translate missing content or invent parity. Report genuine source differences.

## Make legacy CSS work in App Router

Audit selectors qualified by the original body, for example:

```css
body.page-ai .resource-card { ... }
```

Next routes commonly apply page classes to a wrapper because the root layout owns `<body>`. Refactor safe page-scoped selectors to work on either host:

```css
.page-ai .resource-card { ... }
```

Keep selectors scoped to the page class to avoid global leakage. Check dark-theme selectors, pseudo-elements, print rules, media queries, and stylesheet load order. Load page-specific legacy CSS from the route or an appropriate layout; do not assume static HTML `<link>` elements are included when only body fragments are extracted.

Prefer a single source rule for site-wide visual changes. Remove obsolete animations, pseudo-element overlays, and keyframes together rather than stacking increasingly specific overrides.

## Handle scripts deliberately

- Do not expect scripts inside injected HTML to execute.
- Classify each legacy script as global, page-specific, inline configuration, or obsolete.
- Use `next/script` for external scripts when its loading strategies match the requirement.
- Move DOM initialization into an idempotent client component when it depends on rendered elements.
- Preserve CSP nonces and consent gating where present.
- Avoid loading the same analytics or widget script in both layout and page.

## Preserve legacy URLs without conflicts

When `.html` URLs must remain public, use explicit `beforeFiles` rewrites so App Router wins before `public/*.html`, for example:

```js
{ source: "/ai.html", destination: "/en/ai" }
{ source: "/fr/ai.html", destination: "/fr/ai" }
```

Choose one canonical URL policy. Use redirects only when changing the visible canonical URL is intended; use rewrites when preserving it is required. Test direct entry, locale switching, and internal navigation.

## Gestion des secrets et sécurité Stripe

- Ne JAMAIS commit ni exposer la valeur de STRIPE_SECRET_KEY ou NEXT_PUBLIC_STRIPE_SECRET_KEY dans git ou dans les logs.
- La clé peut se trouver dans `.env.secrets` ou `.env.local`, sous le nom STRIPE_SECRET_KEY ou NEXT_PUBLIC_STRIPE_SECRET_KEY (préfixe NEXT_PUBLIC_ inutile ici pour une clé strictement serveur).
- Toujours vérifier la présence de la clé côté backend/rendu serveur sur les environnements prod/dev, et que la route d’API Stripe utilise `process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY`.
- Vérifier que les fichiers secrets sont dans `.gitignore` et ne sont pas poussés en production par un pipeline CI/CD.
- Si une clé manque : afficher une erreur claire niveau process, mais ne jamais "filler" ou générer de clé test automatique.
- Pour la QA, ne jamais générer de faux paiement Stripe : utiliser les test keys Stripe fournies par le dashboard Stripe dev.

## Avoid broad filesystem tracing

Do not pass arbitrary user-controlled or route-derived paths to `readFile`, `path.join(process.cwd(), "public", dynamicValue)`, dynamic imports, or `require`. Turbopack may trace the entire project or public tree.

Use explicit allowlists that map supported page identifiers to statically scoped paths. Reject unknown files before access. Apply the same rule to metadata loaders and nested CV/document routes. Keep path traversal impossible even when the route is statically generated.

## Log Analysis Step (QA prerequisite before runtime or Playwright tests)

Before running any Playwright or end-to-end browser test after a migration, you **must**:

1. Redémarrer Next.js avec `npm run dev` (ou build).
2. Inspecter les logs Next.js dans `.next/dev/logs/next-development.log` (ou l’output terminal).
3. S’assurer qu’il n’y a AUCUNE erreur SSR, import, 500, hydration, ou warning critique dans les logs.
4. Si une erreur est détectée, stopper la migration pour cette page et la corriger avant n’importe quel test browser/Playwright.

Automatisation recommandée : `grep -iE "err|fail|hydration|500" .next/dev/logs/next-development.log` après chaque migration.

## Verify the migration

Run verification in this order:

1. Focused unit tests for locale fallback, extraction modes, metadata, link/src rewriting, unknown-file rejection, query strings, fragments, and double-prefix prevention.
2. TypeScript/lint checks used by the repository.
3. Production build; treat file-tracing and rendering warnings as defects.
4. Runtime verification for every locale with the repository's Next.js dev-loop/browser skill when its version requirements are satisfied.
5. Visual and DOM parity checks against the static references at desktop and mobile widths.

For each locale, assert:

- expected hero and primary heading;
- section and card counts from the baseline;
- representative content from the beginning, middle, and end of the source;
- working localized links, assets, forms, anchors, and external links;
- no duplicate header/footer/scripts;
- no hydration, console, network, accessibility, or server errors;
- correct computed styles for the page wrapper and important cards/hero sections.
- exactly one shared route header outside the homepage;
- no legacy breadcrumb or language-selector duplicates;
- language switching preserves the logical page, query string, fragment when required, and `.html` URL policy;
- nested routes link to their parent directory, while flat routes link only to the localized homepage;
- the shared header disappears or simplifies correctly when its centralized feature flags are disabled.

If runtime tooling has a hard version requirement that the project does not meet, state the limitation. Do not claim browser verification from build success alone.

## Completion criteria

Finish only when:

- one locale-aware App Router route owns the migrated URL;
- all reference content is present or documented as intentionally excluded;
- metadata and legacy URLs behave as intended;
- shared navigation is consistent, localized, non-duplicated, and configurable;
- CSS and scripts work under App Router ownership;
- filesystem access is allowlisted and build warnings are resolved;
- tests and production build pass;
- runtime parity has been verified, or its exact tooling blocker has been reported.
