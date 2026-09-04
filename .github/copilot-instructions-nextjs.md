# Copilot instructions — Next.js

Use `/AGENTS.md` as the canonical policy and `docs/agent-frontend-standards.md` for frontend conventions.

## Current application

- App Router lives at repository-root `app/`; there is no nested application package.
- Next.js 16 / React 19 / TypeScript / next-intl.
- Node.js `>=24.11.0 <25`; npm `>=11.17.0 <12`.
- Install and run commands from the repository root.
- `instrumentation.ts` actively registers OpenTelemetry through `@vercel/otel`.
- Browser analytics are loaded by the shared analytics script; do not add duplicate `@vercel/analytics` or Speed Insights SDK integration.
- Vercel Git Integration owns Preview/production deployment; do not restore a local Vercel CLI wrapper.
- Next DevTools MCP is available on demand through `npx -y next-devtools-mcp@latest`.

## Commands

```bash
npm ci
npm run lint
npm run lint:css
npx next typegen
npm run typecheck
npm run test:unit
npm run build
```

Use `npm test` / Playwright when browser behavior is affected. Preserve the protected static 404 exception defined in `AGENTS.md`.
