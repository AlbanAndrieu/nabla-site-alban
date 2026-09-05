# Vercel deployment instructions

Follow `/AGENTS.md` as the canonical repository policy.

## Deployment contract

- The application is the repository-root **Next.js 16** project.
- Vercel **Git Integration** owns deployments. The local Vercel CLI dependency and manual `vercel deploy` workflow are intentionally retired.
- `master` is the production branch.
- Ordinary feature branches do not auto-deploy.
- Runtime previews are created only through the validated `vercel-preview-*` checkpoint flow in `.github/workflows/vercel-preview.yml`.
- `scripts/vercel-ignore-build.sh` skips documentation/test/editor-only changes that cannot affect the deployed application.
- `vercel.json` is the source of truth for branch deployment policy and framework settings.

## Runtime versions

- Local and GitHub Actions runtime: read `.nvmrc` (Node.js **25.9.0**).
- npm: **11.17.0** in CI.
- `package.json#engines.node` remains `>=24.11.0 <26` so the connected Vercel project can continue using its supported Node 24.x runtime.
- Build command: `npm run build`.
- Install command: `npm ci`.

Do not reintroduce a local Vercel CLI, `vercel dev`, `vercel deploy`, or a second deployment runtime without an explicit architecture decision.

## Preview flow

```text
pull request
  -> CI (Quality and Security)
  -> validated PR head SHA
  -> vercel-preview-pr-<number>
  -> Vercel Git Integration
  -> exact Preview deployment
  -> Playwright against that exact Preview
```

The checkpoint branch must correspond to the SHA validated by Quality/Security. Stale validation results must not publish a Preview.

## Production flow

```text
merge to master
  -> Quality/Security on master
  -> Vercel Git Integration
  -> production deployment
  -> semantic-release after validated master
```

A Vercel deployment failure must not be worked around by weakening CI, branch policy, security controls, or the production build.

## Environment and secrets

Manage production/preview values in the Vercel project environment. Never commit secrets or realistic credentials.

Relevant application values include Stripe configuration and other variables documented in `README.md` and the feature-specific runbooks.

## Troubleshooting

1. Check GitHub Quality/Security first.
2. Confirm the Vercel deployment belongs to the expected commit SHA.
3. Inspect Vercel build/runtime logs for the failing deployment.
4. Reproduce with `npm ci && npm run build` using the repository Node/npm contract.
5. For browser regressions, inspect the exact Preview Playwright run and its artifacts.

Keep this document aligned with `vercel.json`, `.github/workflows/vercel-preview.yml`, `.nvmrc`, and `docs/GITHUB_ACTIONS_SETUP.md`.
