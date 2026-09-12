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

- [x] Tailwind was wired through `@import "tailwindcss"` in `app/globals.css`.
- [x] `postcss.config.mjs` owns the `@tailwindcss/postcss` plugin.
- [x] `package.json` still declares `tailwindcss` and `@tailwindcss/postcss`.
- [x] Repository search found no maintained `@apply` or `@theme` consumers.
- [x] The active Next layout still loads Bootstrap; existing Bootstrap utility
  classes are not treated as proof of Tailwind utility consumption.

## Phase 1 — detach rendered CSS from Tailwind

- [x] Add a project-owned `app/reset.css` preserving the browser reset semantics
  previously supplied by Tailwind Preflight.
- [x] Replace `@import "tailwindcss"` with `@import "./reset.css"` in
  `app/globals.css`.
- [x] Add `unit-tests/cssToolchainMigration.test.ts` to reject Tailwind imports
  and Tailwind directives in maintained CSS.
- [ ] Obtain a green canonical Quality/Security run on the exact branch SHA.
- [ ] Obtain Vercel Preview success on the same SHA.
- [ ] Run the full Playwright Preview suite, including light/dark/mobile and
  accessibility/contrast coverage, on that exact SHA.
- [ ] Run OWASP ZAP Preview on that exact SHA.
- [ ] Compare CSS transfer/build evidence with the pre-migration baseline and
  record any material regression before dependency cleanup.

## Phase 2 — remove Tailwind/PostCSS build graph

Only start after Phase 1 exact-SHA proof is green.

- [ ] Remove `tailwindcss` and `@tailwindcss/postcss` from `package.json`.
- [ ] Delete `postcss.config.mjs` if no remaining PostCSS consumer justifies it.
- [ ] Regenerate/prune `package-lock.json` atomically; do not hand-edit or retain
  orphaned Tailwind packages simply to obtain a small diff.
- [ ] Tighten the CSS toolchain contract so Tailwind packages, PostCSS plugin
  config and lockfile entries are required to be absent.
- [ ] Re-run `npm ci`, lint/stylelint, TypeScript, unit tests and Next build.
- [ ] Compare npm bootstrap time, `node_modules` footprint, CSS transfer and build
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
