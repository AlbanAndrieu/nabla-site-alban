# Vercel Deployment Instructions

This document provides comprehensive guidelines for deploying the Nabla site to Vercel, including both manual deployments and automated SDLC workflows.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deployment Strategies](#deployment-strategies)
5. [Environment Configuration](#environment-configuration)
6. [Monorepo Deployments](#monorepo-deployments)
7. [SDLC Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Overview

The Nabla site is deployed to Vercel with the following architecture:
- **Root project** (this repository): Next.js (`npm run build` / `next build`), serverless handlers under `api/`, and static assets under `public/` (see root `vercel.json`).
- **app**: Next.js application (separate deployment), if present in your fork or layout.

## Prerequisites

### Required Tools
```bash
# Install Node.js (v20 or later recommended)
node --version

# Install Vercel CLI globally
npm install -g vercel@latest

# Verify installation
vercel --version
```

### Required Accounts
- Vercel account (https://vercel.com)
- GitHub repository access
- Appropriate permissions to create Vercel tokens

## Initial Setup

### 1. Link Your Project

First time setup requires linking your local project to Vercel:

```bash
# Navigate to project root
cd /path/to/nabla-site-alban

# Link to Vercel project
vercel link
```

Follow the prompts:
- Set up and deploy: **Yes**
- Which scope: Select your team/personal account
- Link to existing project: **Yes** (if project exists) or **No** (to create new)
- What's your project's name: `nabla-site-alban`
- In which directory is your code located: `./`

This creates a `.vercel` directory with:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

⚠️ **Important**: The `.vercel` directory is in `.gitignore` and should never be committed.

### 2. Configure Vercel Project Settings

Access your project settings at: `https://vercel.com/[your-account]/[project-name]/settings`

#### General Settings
- **Build & Development Settings**:
  - Build Command: Leave empty for a static `public/` root, or set to your framework command (for example `npm run build` in `app/`)
  - Output Directory: `public`
  - Install Command: `npm install`

#### Root Directory
- For root project: `.` (root)
- For my-app: `my-app`
- For vue-client: `vue-client`

### 3. Obtain Required Credentials

For GitHub Actions integration, you need three values:

#### VERCEL_TOKEN
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `GitHub Actions - Nabla Site`
4. Scope: Select your team/account
5. Expiration: Set appropriate duration (or no expiration for persistent SDLC)
6. Copy the token immediately (shown only once)

#### VERCEL_ORG_ID and VERCEL_PROJECT_ID
```bash
# After running 'vercel link', get the IDs:
cat .vercel/project.json
```

Save these values - you'll need them for GitHub Actions secrets.

## Deployment Strategies

### Preview Deployments (Development)

Preview deployments are created for every push and pull request:

```bash
# Deploy to preview environment
vercel

# The CLI will output a preview URL like:
# https://nabla-site-alban-abc123.vercel.app
```

**Characteristics**:
- Unique URL for each deployment
- Perfect for testing changes
- Automatically created by SDLC on PRs
- No production traffic impact
- Accessible to team members

### Production Deployments

Production deployments update your main site:

```bash
# Deploy to production
vercel --prod

# Your site will be available at configured domains:
# https://dr-alban.com
```

**Characteristics**:
- Updates production domains
- Requires explicit `--prod` flag
- Should only deploy from main/master branch
- Automatic rollback capability
- Zero-downtime deployments

### Deployment Workflow Comparison

| Aspect | Preview | Production |
|--------|---------|------------|
| Command | `vercel` | `vercel --prod` |
| Trigger | Any branch/PR | main/master branch |
| URL | Unique preview URL | Production domain |
| Purpose | Testing, review | Live site |
| Rollback | N/A (new deployment) | Previous deployment |

## Environment Configuration

### Environment Variables

Vercel supports three environment types:
- **Production**: Used for `--prod` deployments
- **Preview**: Used for preview deployments
- **Development**: Used for local development (`vercel dev`)

#### Setting Environment Variables via CLI

```bash
# Add environment variable
vercel env add [name]

# Example: Add API key for production
vercel env add API_KEY production
# Then paste the value when prompted

# List all environment variables
vercel env ls

# Remove environment variable
vercel env rm [name] [environment]
```

#### Setting Environment Variables via Dashboard

1. Go to project settings: `https://vercel.com/[account]/[project]/settings/environment-variables`
2. Click "Add"
3. Enter name and value
4. Select environments (Production, Preview, Development)
5. Click "Save"

#### Environment Variables in This Project

Example shape of `vercel.json` (see the committed file for the current values):

```json
{
  "env": {
    "STRIPE_PRICE_ID": "price_..."
  }
}
```

### Secrets Management

**Best Practices**:
- Never commit secrets to version control
- Use Vercel's encrypted environment variables
- Rotate secrets regularly
- Use different secrets for preview vs production
- Limit access to production secrets

## Monorepo Deployments

This repository contains multiple deployable projects. Each should be deployed separately.

### Root Project Deployment

```bash
# From repository root
vercel link
vercel --prod
```

**Configuration**: `vercel.json` in root
- Node.js serverless functions under `api/**/*.js`
- Static files from `public/`
- Routes map `/api/*` to the matching serverless handlers

### my-app (Next.js) Deployment

```bash
cd my-app
vercel link --cwd ./my-app
vercel --prod --cwd ./my-app
```

**Configuration**: `my-app/vercel.json`
- Next.js framework detected automatically
- Separate Vercel project
- Independent domain/subdomain

### vue-client (Vue/Vite) Deployment

```bash
cd vue-client
vercel link --cwd ./vue-client
vercel --prod --cwd ./vue-client
```

**Configuration**: `vue-client/vercel.json`
- Vite build detected automatically
- Separate Vercel project
- Independent deployment lifecycle

### Monorepo Best Practices

1. **Separate Projects**: Create separate Vercel projects for each deployable app
2. **Clear Naming**: Use descriptive project names (e.g., `nabla-site`, `nabla-app`, `nabla-vue`)
3. **Independent Versioning**: Each project can have its own deployment cadence
4. **Shared Dependencies**: Use npm workspaces if needed
5. **Root Directory**: Set the correct root directory in each project's settings

## SDLC Integration

### Deployments from GitHub

There is **no** Vercel deploy workflow in `.github/workflows/` for the root static site. Production and preview deployments are expected from the **Vercel Git integration** (connect the repo in the Vercel dashboard) or from the **CLI** (`vercel`, `vercel --prod`) as described above.

CI in this repository covers tests and tooling (for example Playwright, Docker build, MegaLinter, PDF build). See [docs/GITHUB_ACTIONS_SETUP.md](../docs/GITHUB_ACTIONS_SETUP.md) for the workflow list and required secrets.

### Optional: Vercel CLI from your own workflow

If you add a custom workflow later, typical secrets are:

1. **VERCEL_TOKEN**: Vercel authentication token
2. **VERCEL_ORG_ID**: Organization or team ID
3. **VERCEL_PROJECT_ID**: Project ID

You can deploy a prebuilt output with:

```bash
vercel build
vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

Adjust commands to match your build output directory and Vercel project settings.

### Triggering deployments

#### Automatic triggers (Vercel + Git)

When the repository is linked in Vercel: pushes and pull requests create preview deployments; merges to the production branch deploy to production according to your Vercel project settings.

#### Manual triggers (CLI)

```bash
vercel              # preview
vercel --prod       # production
```

### Deployment Status

Monitor deployments:
1. **GitHub Actions**: Check workflow runs in Actions tab
2. **Vercel Dashboard**: View deployment status at https://vercel.com/dashboard
3. **Vercel CLI**: `vercel ls` shows recent deployments

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Failed to deploy: Invalid token"

**Cause**: VERCEL_TOKEN is incorrect or expired

**Solution**:
1. Generate new token at https://vercel.com/account/tokens
2. Update GitHub secret: Settings → Secrets → VERCEL_TOKEN
3. Re-run workflow

#### Issue: "Project not found"

**Cause**: VERCEL_PROJECT_ID or VERCEL_ORG_ID is incorrect

**Solution**:
1. Run `vercel link` locally
2. Check `.vercel/project.json` for correct IDs
3. Update GitHub secrets with correct values

#### Issue: "Build failed" in GitHub Actions

**Cause**: Failing test or build step (Node, Playwright, TeX, Docker, and so on).

**Solution**:
1. Open the failed workflow run and read the job log for the first red step.
2. Reproduce locally with the same command (for example `npm ci`, `npm run build`, `npm test`).
3. For Playwright, ensure browsers are installed (`npx playwright install`) and `baseURL` matches your app.

#### Issue: "404 Not Found" after deployment

**Cause**: Output directory or routing misconfiguration.

**Solution**:
1. Confirm the Vercel project **Framework Preset** and **Output Directory** match how this app builds (Next.js defaults differ from a plain `public/` static root).
2. Review `vercel.json` routes (for example `/api/*`) and that static files exist under `public/` where you expect them.


#### Issue: Preview deployments not created for PRs

**Cause**: Vercel GitHub integration not connected

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Git
2. Ensure GitHub integration is connected
3. Check GitHub permissions for Vercel app
4. Verify webhook is active in GitHub repository settings

### Debug Mode

Enable debug output for troubleshooting:

```bash
# Local debugging
DEBUG=* vercel

# GitHub Actions debugging
# Add to workflow env:
env:
  VERCEL_DEBUG: "1"
```

### Viewing Logs

#### Vercel Dashboard Logs
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on a deployment
4. View "Build Logs" and "Function Logs" tabs

#### GitHub Actions Logs
1. Go to repository Actions tab
2. Select workflow run
3. Expand job steps to view detailed logs

#### CLI Logs
```bash
# View recent deployments
vercel ls

# Get deployment URL logs
vercel logs [deployment-url]
```

## Best Practices

### Security

1. **Never commit credentials**:
   - Add `.vercel` to `.gitignore` ✅ (already configured)
   - Use GitHub secrets for SDLC credentials
   - Rotate tokens regularly

2. **Use principle of least privilege**:
   - Create separate tokens for SDLC vs manual deployments
   - Limit token scope to specific teams/projects
   - Set token expiration dates

3. **Protect sensitive routes**:
   - Use Vercel's password protection for preview deployments
   - Implement authentication for admin routes
   - Use environment variables for API keys

### Performance

1. **Optimize build times**:
   - Use `--prebuilt` when deploying a CI-built artifact from the CLI
   - Cache dependencies in GitHub Actions where you run builds
   - Keep static roots lean; put heavy frameworks in separate app directories

2. **Optimize assets**:
   - Compress images before deployment
   - Minify HTML/CSS/JS in your build pipeline when applicable
   - Enable Vercel's automatic image optimization
   - Configure appropriate cache headers

3. **Monitor performance**:
   - Use Vercel Analytics
   - Set up Vercel Speed Insights
   - Monitor Core Web Vitals

### Deployment Workflow

1. **Branch protection**:
   - Require PR reviews before merging to main
   - Require passing CI checks
   - Enable status checks for Vercel deployments

2. **Testing strategy**:
   - Review preview deployments before merging
   - Test on actual preview URLs (not just localhost)
   - Verify mobile responsiveness on preview deployments

3. **Rollback strategy**:
   - Keep previous deployments available in Vercel
   - Document rollback procedure
   - Use Vercel's instant rollback feature when needed

4. **Deployment hygiene**:
   - Clean up old preview deployments regularly
   - Monitor deployment frequency
   - Use descriptive commit messages (aids in deployment tracking)

### Documentation

1. **Keep documentation updated**:
   - Update this file when deployment process changes
   - Document environment variables in README
   - Maintain changelog for deployment-related changes

2. **Team communication**:
   - Notify team of deployment changes
   - Share preview URLs for review
   - Document production deployment schedule

## Additional Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel CLI Reference**: https://vercel.com/docs/cli
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Project-specific docs**:
  - [GITHUB_ACTIONS_SETUP.md](../docs/GITHUB_ACTIONS_SETUP.md)
  - [README.md](../README.md)

## Support

For issues specific to this project:
- **GitHub Issues**: Open an issue in this repository
- **Email**: alban.andrieu@dr-alban.com

For Vercel platform issues:
- **Vercel Support**: https://vercel.com/support
- **Vercel Community**: https://github.com/vercel/vercel/discussions
