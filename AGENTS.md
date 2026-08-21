# Repository agent rules

Keep context small. Prefer targeted search/ranges and changed files; never scan generated/vendor output unless required (`node_modules/`, `.next/`, coverage/reports, caches, lockfiles).

## Workflow
1. Inspect only files relevant to the request.
2. Reuse existing patterns and make the smallest safe patch.
3. Validate narrowly first, then broaden checks.
4. For CI failures, inspect the failing job/step and affected files before unrelated code.

## Before pushing
Run `npm run quality:fix`, then `npm run quality:gate`; fix failures and re-run until clean. Never use `--no-verify` or knowingly push failing code. Expensive Playwright, production-build, CodeQL, and deployment checks remain CI gates.

## Project
Next.js 16 / React 19 / TypeScript / next-intl. Node/npm constraints and commands are authoritative in `package.json`.

## 404 invariant
`app/global-not-found.tsx` is the application-wide unmatched-route handler. Do not add root `app/not-found.tsx` unless segment-level `notFound()` behavior is explicitly required. Preserve trusted `public/404.html` rendering semantics and keep `tests/not-found.spec.ts` as regression coverage.

## Next.js
`next.config.mjs` intentionally sets `agentRules: false` so `next dev` does not regenerate large agent context blocks. For Next.js-specific work, locate and read only the relevant installed guide under `node_modules/next/dist/docs/` before editing. Do not add a full documentation index here.