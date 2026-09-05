# Security

## Runtime and deployment boundary

- Production is a Next.js application deployed by Vercel Git Integration.
- The local Vercel CLI and its obsolete manual deployment wrapper are intentionally absent.
- Stripe SDKs remain because Embedded Checkout and server-side Stripe flows actively consume them.
- `@vercel/otel` and its explicit OpenTelemetry peer set (`api`, `api-logs`, `instrumentation`, `sdk-logs`) remain because application instrumentation actively consumes that bundling contract.
- Browser Datadog/Vercel analytics SDK packages are not root dependencies; browser telemetry is loaded through the shared site analytics integration.

## Dependency supply-chain controls

- Local development and GitHub Actions target Node.js 25; the package engine range is `>=24.11.0 <26` so Vercel can keep selecting a supported Node 24 runtime.
- npm is constrained to `>=11.17.0 <12`.
- `.npmrc` enables `strict-allow-scripts=true`.
- Packages with reviewed install scripts are explicitly denied through `package.json#allowScripts`; a new install script must fail until reviewed.
- Never enable `dangerously-allow-all-scripts`.
- The local Vercel CLI, Wrangler deployment config, unused browser observability SDK roots, npm D3 and the local Next DevTools MCP dependency are retired. OpenCommit is intentionally retained as opt-in local tooling; its transitive dependency tree is not part of the deployed runtime.

## Validation

- `CI (Quality and Security)` runs lint, type generation/type-check, unit tests and the production build.
- Snyk runs when `SNYK_TOKEN` is configured.
- `npm audit` remains an advisory signal; upgrades must be reviewed instead of applied with blind `--force`.
- GitHub/CodeQL and deployment checks should be interpreted from their current runs rather than historical vulnerability counts in documentation.

Secrets must never be committed. Use the minimum permissions required by each workflow and keep deployment/release credentials scoped to their task.
