# VS Code Copilot instructions — nabla-site-alban

Follow `/AGENTS.md` as the canonical repository policy.

- Runtime: Next.js 16 / React 19 / TypeScript from the repository root.
- Local/CI Node.js target: **25**; package engine range: `>=24.11.0 <26`; npm: `>=11.17.0 <12`.
- Vercel deployment uses Git Integration; no local Vercel CLI dependency or wrapper is expected.
- OpenCommit is retained as an on-demand local helper (`npm run oco` / `npm run opencommit`); no OpenCommit GitHub workflow is expected.
- The Next DevTools MCP configured in `.vscode/mcp.json` runs with `npx -y next-devtools-mcp@latest`; do not add it back to `package.json`.
- For frontend work, load `docs/agent-frontend-standards.md` on demand.
- Never mutate `master` directly; use a branch, validate, then open a PR.
