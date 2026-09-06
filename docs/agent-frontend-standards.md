# Frontend agent standards

This file preserves the detailed frontend conventions formerly carried in default Copilot context. It supplements `/AGENTS.md`; the protected-branch, security, privacy, quality-gate, testing, hook, publication, CI/CD and release rules in `/AGENTS.md` always apply.

Load this file when a task touches HTML/CSS, accessibility, responsive design, themes, i18n, print/PDF, SEO/crawlers, sitemap/social metadata or frontend performance.

## Accessibility — WCAG 2.1 AA

All frontend changes must maintain WCAG 2.1 Level AA compliance.

- Use semantic HTML elements (`header`, `nav`, `main`, `article`, `section`, `footer`, `aside`) where they express the correct semantics.
- Every meaningful image needs descriptive `alt` text; decorative images use `alt=""`.
- Use ARIA only when native semantics are insufficient. Interactive controls without visible text need an accessible name such as `aria-label` or `aria-labelledby`; use explicit roles only when semantic HTML is unavailable.
- All interactive elements must be keyboard accessible with a logical tab order. Prefer native tabbing or `tabindex="0"`; never remove focus outlines without an equivalent visible focus style.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text.
- Every form input needs an associated `label`. Use `fieldset`/`legend` for grouped controls and connect clear error/help text with `aria-describedby` where appropriate.
- Preserve skip-navigation support.
- Set the correct document `lang` and mark content whose language differs from the page language.

## Responsive design

All pages must remain mobile-first and responsive.

- Keep a valid viewport declaration equivalent to `width=device-width, initial-scale=1`.
- Prefer responsive images with `srcset`/`sizes`; use `picture` when art direction is required.
- Build layouts with flexible Grid/Flexbox rather than brittle fixed widths.
- Preserve practical breakpoints around mobile `<576px`, tablet `576–768px`, desktop `768–1200px`, and large desktop `>1200px` where the existing design uses them; introduce breakpoints according to content rather than duplicating media queries blindly.
- Interactive touch targets must be at least 44×44 CSS px unless an established accessible component already provides equivalent spacing.
- Verify responsive behavior on relevant device sizes when a change can affect layout or interaction.

## Theme support

Maintain the existing light/dark-theme behavior and its current source files/components.

- Preserve the `data-theme`-based theme contract where it is used.
- Preserve system preference detection through `prefers-color-scheme` and the existing explicit theme-toggle behavior.
- Use CSS custom properties for theme values instead of duplicating hard-coded colors.
- Theme controls need accessible labels and keyboard behavior.
- Preserve persisted user preference through `localStorage` where the existing implementation stores it.
- Theme styling must not degrade print output.
- If `public/theme.css` or its successor remains the active theme source for the code being changed, preserve that contract rather than creating a parallel theme system.

## Internationalization

- Always preserve the correct language metadata.
- Keep translatable content separate from component structure; do not hardcode user-visible translated strings in JavaScript/TypeScript when the existing message system should own them.
- Use logical CSS properties where directionality matters so RTL remains possible instead of baking in left/right assumptions.
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for locale-sensitive values.
- Design for text expansion; allow roughly 30–40% more space where layouts would otherwise be brittle under translation.
- Preserve and use the existing locale/language-switching architecture rather than creating a second mechanism.

## Print and PDF

Maintain the repository's existing print/PDF behavior, including `public/print.css` where it remains authoritative.

- Use `@media print` or the existing print stylesheet for print-only adjustments.
- Keep the print stylesheet linked/loaded through the repository's current architecture when a legacy document depends on it.
- Hide unnecessary navigation, footer chrome, ads or other non-print UI where appropriate without hiding required content.
- Prefer high-contrast black text on a white background for printable content and avoid unnecessary decorative backgrounds/images that waste ink.
- Preserve sensible page-break behavior (`break-*` or the existing `page-break-*` equivalents) and avoid splitting important blocks when possible.
- Preserve URL expansion for printed links where the existing stylesheet provides it.
- Keep configured page size and margins, including A4/2cm conventions where already required by the document.
- Any print action/button must use accessible semantics and the existing `window.print()`-based print flow or its current equivalent.

## SEO

Every indexable page must remain search-engine friendly.

- Provide a unique descriptive title, generally around 50–60 characters when practical.
- Provide an appropriate meta description, generally around 150–160 characters when practical.
- Meta keywords are optional; when retained for an existing page, keep them relevant rather than stuffing keywords.
- Preserve a correct heading hierarchy, normally one page-level `h1` followed by logical lower levels.
- Use canonical URLs to avoid unintended duplicates.
- Maintain appropriate robots/indexing metadata and HTTPS canonical URLs.
- Add or preserve structured data (JSON-LD) where the page semantics warrant it; keep Schema.org types/properties accurate.
- Keep URL structures descriptive and internal link text meaningful.
- Optimize image filenames/content where relevant and retain meaningful alternative text.
- Preserve author metadata on legacy pages where it remains part of the established metadata contract.
- Critical page content must not become inaccessible to crawlers solely because of unnecessary client-side JavaScript.

## Crawler policy

- Keep `public/robots.txt` aligned with the intended crawler policy, including allowed legitimate crawlers, configured blocked AI bots/scrapers, any intentional crawl-delay directives and the canonical sitemap directive.
- Use per-page robots metadata such as `index, follow` or intentional `noindex, nofollow`/`noindex` behavior according to page policy.
- Keep generated/legacy HTML valid and well structured.
- Maintain fast-loading pages; the legacy guidance target is under roughly three seconds where network/device conditions make that meaningful, while measured Core Web Vitals and current performance budgets take precedence over a synthetic absolute threshold.
- Preserve mobile friendliness and HTTPS.
- Avoid moving critical content to JavaScript-only rendering without an architectural reason and crawler validation.

### Sitemap

- `lib/sitePageCatalog.ts` is the source of truth when adding/removing/categorizing/reprioritizing SEO pages.
- `app/sitemap.ts` generates the App Router sitemap from `SEO_PAGE_SLUGS`; do **not** add a competing static sitemap under `public/`.
- Keep `unit-tests/sitePageCatalog.test.ts` and `tests/seo-indexing.spec.ts` aligned with intentional sitemap/indexing-policy changes.
- Preserve `Sitemap: https://www.albanandrieu.com/sitemap.xml` in `public/robots.txt`; `www` is the canonical production origin.
- Search-engine-console submissions are an operational follow-up after relevant deployment changes, not a substitute for repository validation.

## Open Graph and social metadata

Indexable/social pages must keep appropriate Open Graph and Twitter/X card metadata through the current Next.js metadata architecture or the existing static metadata for legacy pages.

- Preserve equivalent metadata for `og:title`, `og:type`, `og:url`, `og:image`, `og:description` and `og:site_name` where applicable.
- Social images should use a share-friendly aspect ratio (typically about 1.91:1 / 1200×630), be served in a supported image format such as JPG/PNG, and expose image width/height when the current metadata API supports them.
- Preserve Twitter/X card metadata equivalent to card type, site/account when configured, title, description and image.
- Preserve locale-specific Open Graph metadata such as `og:locale`.
- Use the correct content-specific Open Graph type when it materially differs from `website`.
- Validate changed social metadata with the relevant sharing debugger/card preview tooling when a task changes share metadata.

## Code consistency and reusability

### HTML

- Use HTML5 semantic markup and a valid `<!doctype html>` in standalone legacy documents.
- Match the indentation/formatting convention of the file; legacy static HTML uses two spaces where that convention already applies.
- Close elements correctly, use lowercase element/attribute names and double-quoted attribute values in legacy HTML.
- Comment only complex/non-obvious sections; meaningful structural comments are appropriate, noise comments are not.

### CSS

- Keep related component/section styles together and reuse existing components/utilities before introducing duplicates.
- Use kebab-case for legacy CSS class names and CSS custom properties for repeated/theme values.
- Write mobile-first rules when adding new responsive CSS.
- Avoid `!important` unless it is required to integrate with an existing external/legacy cascade and a less brittle selector is not viable.
- Prefer component-scoped styles or the repository's established stylesheet location rather than creating parallel styling systems.

### JavaScript and TypeScript

- Use modern ES6+ language features and the TypeScript/ESLint rules already configured by the project.
- Prefer `const`; use `let` only for reassignment and do not introduce `var`.
- Prefer `async`/`await` over unnecessarily nested promise chains for readable asynchronous flows and include appropriate error handling.
- Use template literals where interpolation improves clarity and arrow functions for callbacks where they fit existing style.
- Extract reusable functions/modules instead of copying logic.
- Document complex/non-obvious public behavior with concise comments or JSDoc where it adds value; do not over-document self-evident code.

### Assets and file organization

- Keep public assets under the repository's established `public/assets/` hierarchy or the existing feature-specific location.
- Keep CSS/JavaScript/images in their established directories for legacy pages; do not create a competing organization merely to satisfy a generic convention.
- Use descriptive lowercase/kebab-case filenames for legacy public assets/pages where that convention applies.
- Optimize images/assets before adding large binaries.
- Do not duplicate an existing asset/component merely to work around import or organization issues.

### Reusability and documentation

- Follow DRY: extract common patterns rather than duplicating markup/styles/logic.
- Use reusable components/partials/modules when the current architecture supports them.
- Update README or feature documentation when an architectural/operational change would otherwise leave repository guidance incorrect.
- Use JSDoc/CSS comments for complex behavior where useful, not as mandatory boilerplate for trivial code.

## Performance

- Keep production CSS/JavaScript minification/optimization compatible with the Next.js build pipeline; do not add hand-minified source that harms maintainability.
- Compress/optimize images and use lazy loading below the fold when appropriate.
- Defer or asynchronously load non-critical scripts when compatible with their behavior and the Next.js script strategy.
- Avoid unnecessary third-party code and duplicate libraries; use the existing dependency/runtime architecture.
- Use CDN delivery for common external assets only when compatible with the repository's security/performance policy and existing architecture.
- Treat critical CSS and resource prioritization as performance tools to apply when measurements or the current architecture justify them, not as reasons to bypass the framework pipeline.

## Testing and validation

Do not reduce existing tests or quality gates.

- Run the closest relevant unit/format/lint/type check first, then the canonical gate and native CI required by `/AGENTS.md`.
- Keep accessibility, responsive, browser and SEO tests aligned with intentional behavior changes.
- Use Playwright for end-to-end behavior and deployment validation according to the existing workflow. On failure, traces/screenshots/videos/reports are diagnostic evidence and must be retrieved when they materially help; difficult failures justify the full artifact set.
- When manual/external validation is relevant, use W3C HTML/CSS validators, accessibility tools/screen readers, representative Chrome/Firefox/Safari/Edge testing, responsive device sizes and Lighthouse or equivalent performance tooling as appropriate to the change.
- Verify links/canonical routes after deployment changes that can affect routing.
- Do not claim a browser/device/validator/manual test was executed unless it actually was.

## Git and deployment frontend standards

- Use conventional commits and feature branches as required by `/AGENTS.md` and release policy.
- Keep commits focused and test before publishing according to the canonical agent publish policy.
- After routing, SEO or metadata changes, verify the affected deployment, links, canonical routes, sitemap and robots behavior that can materially change.
- Updating the sitemap means updating its source-of-truth catalog/tests, not maintaining a separate hand-written sitemap.
- Preserve the repository's deployment gates and Vercel Preview/Playwright behavior; frontend optimization never justifies skipping a requested deployment validation.
