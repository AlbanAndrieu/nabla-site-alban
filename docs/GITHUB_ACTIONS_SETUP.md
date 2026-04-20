# GitHub Actions Workflow Setup

This document tracks the workflows currently present in `.github/workflows/` and the secrets they depend on.

## Current workflow inventory

The repository currently includes:

1. `playwright.yml` — browser end-to-end tests.
2. `docker-build.yml` — Docker build/push + Trivy scan.
3. `mega-linter.yml` — linting and optional auto-fix commit/PR behavior.
4. `build-pdf.yml` — CV PDF generation via TeX Live.
5. `opencommit.yml` — automated commit message helper.
6. `copilot-setup-steps.yml` — setup flow for Copilot coding agent runs.

There is no `hugo-deploy.yml` workflow in the repository.

## Required GitHub secrets

### 1. `DOCKER_USERNAME`

Used by `docker-build.yml` for Docker Hub login.

### 2. `DOCKER_PASSWORD`

Used by `docker-build.yml` for Docker Hub login.

### 3. `OCO_API_KEY`

Used by `opencommit.yml` (`di-sukharev/opencommit`) for model access.

### Optional secret: `PAT`

`mega-linter.yml` can use `PAT` for checkout/PR operations and falls back to `GITHUB_TOKEN` when `PAT` is not set.

## Adding or updating secrets

1. Open the repository on GitHub.
2. Go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Select `New repository secret`.
4. Add each secret key/value pair above.

## Behavior notes

- Playwright tests run on push and pull request for `main`, `master`, and `develop`.
- Docker CI and MegaLinter skip markdown-only changes because of `paths-ignore`.
- CV PDF build runs on push and pull request.
- OpenCommit runs on push for non-protected branches (`branches-ignore` includes `main`, `master`, `dev`, `development`, `release`).

## Security notes

- Do not commit secret values to the repository.
- Rotate long-lived tokens periodically.
- Scope tokens to minimum required permissions.
