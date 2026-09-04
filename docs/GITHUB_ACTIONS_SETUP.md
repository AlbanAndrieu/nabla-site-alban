# GitHub Actions workflow setup

This document records the workflows currently versioned under `.github/workflows/`.

## Workflow inventory

1. `ci.yml` — Quality/Security: lint, CSS lint, Next route types, type-check, unit tests, production build and optional Snyk.
2. `playwright.yml` — exact Vercel Preview browser tests.
3. `vercel-preview.yml` — Vercel Preview orchestration/dispatch.
4. `release.yml` — semantic-release after validated `master`.
5. `mega-linter.yml` — repository-wide linting.
6. `docker-build.yml` — Docker build/publish and security validation.
7. `build-pdf.yml` — CV PDF generation.
8. `copilot-setup-steps.yml` — coding-agent setup.

OpenCommit is retained as local npm tooling, but there is no current OpenCommit GitHub Actions workflow.

## Runtime contract

- GitHub Actions use Node.js 25. Vercel Functions remain on a Vercel-supported Node runtime (currently 24.x).
- npm `>=11.17.0 <12`.
- Install from the repository root with `npm ci`.
- `.npmrc` enables strict install-script policy; reviewed scripts are denied explicitly through `package.json#allowScripts`.
- Vercel deployment is driven by Git Integration rather than the local Vercel CLI.

## Secrets

- `DOCKER_USERNAME` / `DOCKER_PASSWORD`: Docker publishing when that workflow is used.
- `SNYK_TOKEN`: optional Snyk step in Quality/Security.
- `RELEASE_APP_PRIVATE_KEY` with `RELEASE_APP_CLIENT_ID`: preferred semantic-release GitHub App credentials.
- `PAT`: optional MegaLinter fallback where configured.

The local OpenCommit helper does not require a GitHub Actions workflow. Add OCO/OpenCommit workflow secrets only if such a workflow is explicitly reviewed and reintroduced.

## Validation

For dependency or code changes, use the repository quality gate documented in `AGENTS.md`.
Browser-affecting changes are additionally validated by Playwright against the exact Vercel Preview.
