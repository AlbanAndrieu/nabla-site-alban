# Tailwind / PostCSS exit roadmap

Last reconciled: 12 September 2026.

This is the scoped execution plan for removing Tailwind CSS from `nabla-site-alban`.
`docs/quality-roadmap.md` remains the canonical cross-project/product roadmap; this
file keeps the migration checkpoints small enough to validate independently.

Reference implementation: `AlbanAndrieu/nabla-site-bababou#182`.

## Goal

Remove Tailwind from the rendered CSS and, after exact-SHA proof, remove its
PostCSS/build dependencies and lockfile graph without changing the intended UI,
accessibility, responsive behavior or Bootstrap compatibility surfaces.

## Current evidence

- [x] Phase 1 replaced the rendered `@import "tailwindcss"` entrypoint with the
  project-owned `app/reset.css`.
- [x] Repository contracts find no maintained `@apply`, `@theme` or other
  Tailwind directive consumers.
- [x] The active Next layout still loads Bootstrap; existing Bootstrap utility
  classes are not treated as proof of Tailwind utility consumption.
- [x] Phase 2 removes the Tailwind/PostCSS plugin configuration and direct
  development dependencies without broadening the scope into Bootstrap cleanup.

## Phase 1 — detach rendered CSS from Tailwind

- [x] Add a project-owned `app/reset.css` preserving the browser reset semantics
  previously supplied by Tailwind Preflight.
- [x] Replace `@import "tailwindcss"` with `@import "./reset.css"` in
  `app/globals.css`.
- [x] Add `unit-tests/cssToolchainMigration.test.ts` to reject Tailwind imports
  and Tailwind directives in maintained CSS.
- [x] Obtain a green canonical Quality/Security run on the exact branch SHA:
  CI #1099 / run `34668654199` on `f8e0500e0c97a5cda474754ed6d920cd7b03ec42`.
- [x] Obtain Vercel Preview success on the same SHA.
- [x] Run the full Playwright Preview suite, including light/dark/mobile and
  accessibility/contrast coverage, on that exact SHA: 141/141 passed in
  Playwright #871 / run `34668755500`.
- [x] Run OWASP ZAP Preview on that exact SHA: run `34668755528` passed with
  zero blocking findings; policy-accepted diagnostics remain H0/M4/L10/I5.
- [ ] Compare CSS transfer/build evidence with the pre-migration baseline and
  record any material regression before closing the migration.

## Phase 2 — remove Tailwind/PostCSS build graph

Phase 1 exact-SHA proof is green, so dependency cleanup is active.

- [x] Remove `tailwindcss` and `@tailwindcss/postcss` from `package.json`.
- [x] Delete `postcss.config.mjs`; no remaining maintained PostCSS consumer
  justifies a project-level plugin configuration.
- [x] Regenerate/prune `package-lock.json` atomically with Node 26.8.2 and npm
  11.17.0 rather than hand-editing it. The generated diff removes 726 lockfile
  lines and also reconciles the root Node engine metadata to `<27`.
- [x] Tighten the CSS toolchain contract so direct dependencies, project PostCSS
  config and all `node_modules/tailwindcss` / `node_modules/@tailwindcss/*`
  lockfile packages are required to be absent.
- [ ] Re-run `npm ci`, lint/stylelint, TypeScript, unit tests and Next build.
- [ ] Compare npm bootstrap time, dependency footprint, CSS transfer and build
  output with the Phase 1 checkpoint.
- [ ] Re-run exact-SHA Vercel, Playwright Preview E2E and OWASP ZAP Preview.

## Phase 3 — close the migration

- [ ] Remove temporary phase-specific assertions/comments once the complete
  absence contract is authoritative.
- [ ] Update `docs/quality-roadmap.md` to mark the Tailwind/PostCSS removal done
  only after the Phase 2 exact-SHA checks are green.
- [ ] Keep Bootstrap removal as a separate migration: Tailwind exit must not be
  used to silently broaden the scope into Bootstrap/CDN cleanup.

## Rollback rule

If the project-owned reset changes a visible behavior that is not an intentional
fix, restore the previous rendering first, identify the missing Preflight semantic,
then amend `app/reset.css`. Do not reintroduce Tailwind utilities as a shortcut.
