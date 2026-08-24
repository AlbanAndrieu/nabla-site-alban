---
name: next-migrate-locale-pages
description: Migrate localized static or legacy HTML pages into Next.js App Router locale routes while preserving content, SEO, shared navigation, styles, links, scripts, and legacy URLs. Use for public/*.html plus localized public HTML trees, duplicated app/en and app/fr routes, inconsistent locale headers or breadcrumbs, incomplete static-to-Next migrations, rendering regressions after migration, or Turbopack file-tracing warnings caused by loading legacy files.
---

# Next.js Migration Skill — Best Practices (EN)

Migrate pages into `app/[locale]/<route>/page.tsx` without losing information or treating a successful compile as proof of parity.

---

## IMPORTANT: i18n message file update best-practices

**Never overwrite the global translation file!**

When adding translations for a specific page:
- Always parse the existing `messages/en.json` and `messages/fr.json` in full, and MERGE or APPEND only the key(s) for the new/migrated page.
- Never overwrite or truncate any unrelated translation keys/sections. These JSON files are _global registries_ for all locale strings (used by all pages and components).
- Use a workflow that always reads and merges the full file before writing.
- **The only supported tool in this repository for patch operations on the global catalogs is:**
  ```
  node scripts/merge-i18n-message.js messages/en.json patch.json
  ```
  `patch.json` should contain only the new/modified keys (e.g. `{ "404": { ... } }`).
  This deep-merges and preserves the rest.
  All automation or manual edits to the global catalogs MUST use this script.
- All automations/scripts must do read-modify-write (never replace).

### Feature-scoped catalogs

Large actively maintained features may use a small feature-scoped catalog such as `messages/truenas/en.json` and `messages/truenas/fr.json` when that keeps the global registries manageable. In that case:
- merge the feature catalog into the Next-Intl message object in `i18n/request.ts`;
- keep the same namespace/key structure in every supported locale;
- add or extend a unit test that verifies locale structure parity;
- keep canonical product/model names as data and translate only surrounding human-facing copy;
- do not duplicate an existing global namespace in a feature catalog.

**Never create component-local translation dictionaries such as `COPY = { en: ..., fr: ... }`.** Visible UI copy must come from Next-Intl message catalogs and be passed to pure presentation components or read through the appropriate Next-Intl API.

**Rule:**
> Any script/manual edit must only update the **subtree** for the page/component and NEVER destroy or replace other unrelated parts of the file.

If unsure: always review via diff or use a linter.

---

## Migration traps: rewrites, redirects & legacy HTML

**Always check for rewrites or redirects that might shadow your React app with static HTML or legacy content!**

- Examine `vercel.json`, `next.config.mjs`, etc for:
  - `{ "source": "/jm", "destination": "/jm/index.html" }`
  - `/{slug}.html -> /[locale]/{slug}` or inverse
  - Home/policy/landing rewrites
- A fallback or rewrite can shadow even a migrated app route!

**Rule:**
- If a React page exists in `app/[locale]/...`, never update the static HTML.
- Only migrate a rewrite/Fallback after true parity.
- When ready, REMOVE obsolete rewrites.
---

## Migration process (core)

**Global pattern for Next.js migration:**
- NEVER import or code JSX of nav/footer/cta into page-specific files (`page.tsx`): ALL such UI must come from the layout global (`layout.tsx` or shared global component).
- After migration, always remove nav/footer UI and back/nav CTAs from pages — dupes in both page and layout create SSR/CSR bugs and UX confusion.
- Apply this pattern to all migrated pages (EN/FR).

---
### ⚠️ Correction clé : import des composants partagés

Quand vous migrez un fichier volumineux (nabla, truenas, workstation, expertise, etc), n’importe quelle importation de composant partagé doit utiliser un chemin relatif correct depuis la page — rarement `"app/components/..."`, mais souvent du type `import SiteFooter from "../../../components/SiteFooter";` ou avec alias projet (ex `@/components/SiteFooter`).
Vérifiez que chaque import pointe bien vers le bon `components/` racine : cela évitera les erreurs `"Module not found : Can't resolve 'app/components/Footer'"` observées dans tous les retours d’expérience.

**Best practice for large HTML pages (block-by-block subcomponent migration):**
- Any migration of a large static HTML (like expertise, truenas, freenas, workstation, ...) **must** be split into multiple React subcomponents — one per logical section (Hero, Services, AI/ML, Skills, Technologies, Timeline, etc.).
- For each section, create a separate React file (e.g. `app/components/{slug}/{Section}.tsx`), and extract all visible text labels to Next-Intl message catalogs.
- The final page (`page.tsx`) assembles these components, eliminating risk of missing context, truncated exports, or token overflow.
- This segmentation ensures: no section loss, maintainable UX, and industrialized i18n.
- Use this approach **systematically** for every page too large to migrate as a single export/file.

---

## Pour quels fichiers volumineux ? (déjà migrés)

- app/[locale]/truenas/page.tsx
- app/[locale]/workstation/page.tsx
- app/[locale]/nabla/page.tsx
- app/[locale]/expertise/page.tsx

**Choose the model**

- Prefer native React + message catalogs for actively maintained/shared pages.
- Use server-side extraction only for legacy static pages.

---

## KEY RULE FOR TRANSLATION FILES (messages/en.json, fr.json, …)

Whenever you add a new page or translation key:
- Merge/append only the relevant section;
- Never remove, replace, or truncate others;
- Always validate via diff or linter before PR/merge.

---
