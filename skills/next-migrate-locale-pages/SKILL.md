---
name: next-migrate-locale-pages
description: Migrate localized static or legacy HTML pages into Next.js App Router locale routes while preserving content, SEO, shared navigation, styles, links, scripts, and legacy URLs. Use for public/*.html plus localized public HTML trees, duplicated app/en and app/fr routes, inconsistent locale headers or breadcrumbs, incomplete static-to-Next migrations, rendering regressions after migration, or Turbopack file-tracing warnings caused by loading legacy files.
---

# Next.js Migration Skill — Best Practices (EN)

Migrate pages into `app/[locale]/<route>/page.tsx` without losing information or treating a successful compile as proof of parity.

---

## i18n catalog ownership

Use Next-Intl as the only source of human-facing localized copy. **Never create component-local locale dictionaries** such as `COPY = { en: ..., fr: ... }`.

The repository supports two catalog classes:

1. `messages/{locale}.json` — legacy/global namespaces and genuinely site-wide copy.
2. `messages/<feature>/{locale}.json` — actively maintained feature domains such as `truenas` or shared UI domains such as `homelab`.

### Rules for feature catalogs

- A feature catalog owns one distinct top-level namespace, e.g. `messages/truenas/fr.json` owns `truenas`.
- Shared cross-page UI gets its own domain instead of being borrowed from an unrelated page. Example: TrueNAS and Nabla both consume `homelab`, rather than Nabla importing TrueNAS page copy.
- Load feature catalogs centrally through `i18n/messages.ts`; `i18n/request.ts` should delegate to that loader rather than accumulating feature-specific imports.
- The loader must reject duplicate top-level namespaces.
- During incremental extraction, explicitly retire the old namespace from the legacy/global catalog at runtime. Remove the physical legacy block in a later safe JSON migration rather than allowing two runtime sources of truth.
- Keep the same key structure in every supported locale and cover each feature catalog with locale-parity tests.
- Keep canonical technical/product/model data in typed TypeScript data modules; translate only surrounding human-facing copy.
- Server components should normally read their own namespace with `getTranslations()` instead of receiving large translation objects through several component layers.
- Client components should use `useTranslations()` for their own localized state, status, tooltips and accessibility labels.

### Editing catalogs safely

**Never overwrite or truncate an unrelated translation subtree.**

For the large legacy/global catalogs, prefer the repository merge helper:

```text
node scripts/merge-i18n-message.js messages/en.json patch.json
```

Feature catalogs are intentionally small enough to review as complete files, but edits must still preserve unrelated keys and locale parity.

---

## Migration traps: rewrites, redirects & legacy HTML

**Always check for rewrites or redirects that might shadow your React app with static HTML or legacy content.**

Examine `vercel.json`, `next.config.mjs`, etc. for rules such as:

- `{ "source": "/jm", "destination": "/jm/index.html" }`
- `/{slug}.html -> /[locale]/{slug}` or the inverse
- home/policy/landing fallbacks

If a React page exists in `app/[locale]/...`, do not keep updating the static HTML as a parallel source of truth. Remove obsolete rewrites only after parity is verified.

---

## Migration process

### Shared layout UI

Do not duplicate global navigation, footer or back-navigation UI in page-specific files. Shared page chrome belongs in the locale layout or shared components.

Reuse existing primitives such as:

- `TopAnchor`
- `SkipToMainContent`
- `AnchoredHeading`

Do not reimplement their markup page by page.

### Large-page component boundaries

Large pages such as `truenas`, `nabla`, `workstation` and `expertise` should be split by logical responsibility: Hero, Services, Hardware, AI/ML, Skills, Technologies, Timeline, etc.

For each section:

- keep rendering logic in a dedicated component;
- put localized human-facing copy in its owning Next-Intl namespace;
- keep stable technical inventories/configuration in typed data modules;
- avoid giant `copy` props when the server component can read its namespace itself;
- use stable authored IDs with `AnchoredHeading` for shareable sections rather than generating IDs from translated text.

### Shared component imports

The `@/*` alias maps to the repository root. Therefore:

```ts
import AnchoredHeading from "@/components/AnchoredHeading";
```

means `components/AnchoredHeading.tsx`, **not** `app/components/AnchoredHeading.tsx`.

Feature-specific components can remain under `app/components/<feature>/`.

---

## Validation before merge

For every migration/refactor:

- run ESLint and CSS linting;
- generate Next.js route types;
- run `tsc --noEmit`;
- run unit tests, including locale-structure parity tests;
- verify canonical/hreflang behavior and legacy redirects when routes changed;
- review the diff for accidental translation loss or duplicate namespaces.

A successful compile alone is not proof of migration parity.
