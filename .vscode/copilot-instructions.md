# VS Code Copilot instructions — nabla-site-alban

Follow `/AGENTS.md` as the canonical repository policy.

- Runtime: Next.js 16 / React 19 / TypeScript from the repository root.
- Node.js: `>=24.11.0 <25`; npm: `>=11.17.0 <12`.
- Vercel deployment uses Git Integration; no local Vercel CLI dependency or wrapper is expected.
- OpenCommit is retired.
- The Next DevTools MCP configured in `.vscode/mcp.json` runs with `npx -y next-devtools-mcp@latest`; do not add it back to `package.json`.
- For frontend work, load `docs/agent-frontend-standards.md` on demand.
- Never mutate `master` directly; use a branch, validate, then open a PR.
