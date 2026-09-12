# Copilot instructions — nabla-site-alban

`/AGENTS.md` is the canonical repository policy. Follow it first; do not duplicate or weaken its branch, quality, security, privacy, testing or publication rules here.

## Runtime

- Next.js 16 / React 19 / TypeScript / next-intl from the repository root.
- Node.js: local/CI target **26.8.2**; `package.json` accepts `>=24.11.0 <27` so local/CI can use Node 26 while Vercel can continue using its supported Node 24 runtime.
- npm: `>=11.17.0 <12`.
- Root `package.json` and `package-lock.json` are the only application npm manifests.
- Vercel deployment is handled by Git Integration; there is no local Vercel CLI deployment path.
- OpenCommit is retained as an on-demand local commit-message helper through `npm run oco` / `npm run opencommit`; no GitHub OpenCommit workflow is versioned.
- Next DevTools MCP is invoked on demand with `npx -y next-devtools-mcp@latest`; it is not a project dependency.

## Working rules

- Never write directly to `master`; use a dedicated branch and pull request.
- Prefer targeted repository reads and the smallest safe patch.
- For frontend/i18n/accessibility/SEO work, load `docs/agent-frontend-standards.md`.
- For Next.js-specific work, follow the targeted installed Next.js guidance required by `AGENTS.md`.
- After edits, run `npm run quality:agent:fix`, commit the converged deterministic fixes, then push normally; the installed pre-push hook performs the strict publication gate once. Do not duplicate that full gate manually immediately before push.
- Treat `QG_AUTOFIX_REQUIRED` as an instruction to run the local fix phase, not as a reason to consume tokens on broad CI-log analysis.
- The Copilot setup installs full Git history, repository Git hooks, Python/pre-commit and Node dependencies required by the same local-first gate used in CI.
- CI remains authoritative for independent verification, the production build and configured security/deployment checks.
