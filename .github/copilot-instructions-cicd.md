# Copilot instructions — CI/CD

`/AGENTS.md` is authoritative. This file only records CI/CD-specific facts.

## Current workflows

- `ci.yml` — canonical Quality/Security gate.
- `playwright.yml` — browser validation against the exact Vercel Preview.
- `vercel-preview.yml` — Preview hand-off/orchestration.
- `release.yml` — semantic-release.
- `mega-linter.yml` — repository-wide linting.
- `docker-build.yml` — Docker validation/publishing.
- `build-pdf.yml` — CV PDF generation.
- `copilot-setup-steps.yml` — coding-agent bootstrap.

Do not document or restore workflows that are no longer versioned.

## Runtime and dependency installation

- GitHub Actions use the repository `.nvmrc` (**Node.js 25.9.0**).
- npm: **>=11.17.0 <12**.
- Run Node/npm commands from the repository root.
- `package.json` and `package-lock.json` are the only application npm manifests.
- `.npmrc` enables `strict-allow-scripts`; every dependency install script must be explicitly reviewed in `package.json#allowScripts`.
- Never use `dangerously-allow-all-scripts`.
- The local Vercel CLI is retired. OpenCommit remains local/on-demand and must not be reintroduced as a GitHub workflow without explicit review.
- Vercel deployments come from Git Integration.

## Workflow changes

1. keep permissions least-privileged;
2. keep action versions pinned where the existing workflow pins them;
3. keep Node/npm versions aligned with `package.json`;
4. keep `.npmrc` in Quality path filters;
5. update workflow-contract tests when triggers or release behavior change;
6. do not add duplicate Next builds to Playwright when Preview E2E already covers the deployed artifact;
7. preserve the release workflow's workflow-safe semantic baseline logic.

Use targeted job/step logs first when diagnosing CI failures.
