# Copilot instructions — nabla-site-alban

`/AGENTS.md` is the canonical repository policy. Follow it first; do not duplicate or weaken its branch, quality, security, privacy, testing or publication rules here.

## Runtime

- Next.js 16 / React 19 / TypeScript / next-intl from the repository root.
- Node.js: `>=24.11.0 <25`.
- npm: `>=11.17.0 <12`.
- Root `package.json` and `package-lock.json` are the only application npm manifests.
- Vercel deployment is handled by Git Integration; there is no local Vercel CLI deployment path.
- OpenCommit is not part of the repository tooling.
- Next DevTools MCP is invoked on demand with `npx -y next-devtools-mcp@latest`; it is not a project dependency.

## Working rules

- Never write directly to `master`; use a dedicated branch and pull request.
- Prefer targeted repository reads and the smallest safe patch.
- For frontend/i18n/accessibility/SEO work, load `docs/agent-frontend-standards.md`.
- For Next.js-specific work, follow the targeted installed Next.js guidance required by `AGENTS.md`.
- Run the closest checks first, then `bash scripts/quality-gate.sh` before publication when a local checkout is available.
- CI remains authoritative for lint, type generation/type-check, unit tests, production build and configured security checks.
