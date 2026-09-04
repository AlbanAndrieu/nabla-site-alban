# Security

## Runtime and deployment boundary

- Production is a Next.js application deployed by Vercel Git Integration.
- The local Vercel CLI and its obsolete manual deployment wrapper are intentionally absent.
- Stripe SDKs remain because Embedded Checkout and server-side Stripe flows actively consume them.
- `@vercel/otel` and `@opentelemetry/api` remain because application instrumentation actively consumes them.
- Browser Datadog/Vercel analytics SDK packages are not root dependencies; browser telemetry is loaded through the shared site analytics integration.

## Dependency supply-chain controls

- Node.js is constrained to `>=24.11.0 <25`.
- npm is constrained to `>=11.17.0 <12`.
- `.npmrc` enables `strict-allow-scripts=true`.
- Packages with reviewed install scripts are explicitly denied through `package.json#allowScripts`; a new install script must fail until reviewed.
- Never enable `dangerously-allow-all-scripts`.
- OpenCommit, the local Vercel CLI, unused observability SDK roots, npm D3 and the local Next DevTools MCP dependency are retired to reduce the dependency graph and attack surface.

## Validation

- `CI (Quality and Security)` runs lint, type generation/type-check, unit tests and the production build.
- Snyk runs when `SNYK_TOKEN` is configured.
- `npm audit` remains an advisory signal; upgrades must be reviewed instead of applied with blind `--force`.
- GitHub/CodeQL and deployment checks should be interpreted from their current runs rather than historical vulnerability counts in documentation.

Secrets must never be committed. Use the minimum permissions required by each workflow and keep deployment/release credentials scoped to their task.
