# Repository agent rules

Canonical instructions for Cursor, OpenCode, Codex, and GitHub Copilot. Keep context small: inspect targeted files/ranges and changed files only. Never scan generated/vendor output unless required (`node_modules/`, `.next/`, coverage/reports, caches, lockfiles).

## Workflow
1. Inspect only files relevant to the request.
2. Reuse existing patterns and make the smallest safe patch.
3. Load a relevant `.agents/skills/*/SKILL.md` only when the task needs that specialization.
4. Validate narrowly first, then broaden checks.
5. For CI failures, inspect the failing job/step and affected files before unrelated code.

## Before pushing
Run `npm run quality:fix`, then `npm run quality:gate`; fix failures and re-run until clean. Never use `--no-verify` or knowingly push failing code. Expensive Playwright, production-build, CodeQL, and deployment checks remain CI gates.

## Project
Next.js 16 / React 19 / TypeScript / next-intl. `package.json` is authoritative for Node/npm constraints and commands. Preserve accessibility, responsive/mobile-first behavior, i18n, SEO, theme support, and existing tests when touching related code.

## 404 invariant
`app/global-not-found.tsx` is the application-wide unmatched-route handler. Do not add root `app/not-found.tsx` unless segment-level `notFound()` behavior is explicitly required. Preserve trusted `public/404.html` rendering semantics and keep `tests/not-found.spec.ts` as regression coverage.

## Next.js
`next.config.mjs` intentionally sets `experimental.agentRules: false` so `next dev` does not regenerate large agent context blocks. For Next.js-specific work, read only the relevant installed guide under `node_modules/next/dist/docs/` before editing.

## Agent configuration
`AGENTS.md` and `.agents/skills/` are the canonical cross-agent sources. Do not duplicate general repository guidance in tool-specific files. Keep Cursor/OpenCode/Codex/Copilot-specific configuration only when a capability cannot be represented by these shared sources.