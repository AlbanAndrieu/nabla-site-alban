# Copilot Instructions for CI/CD Workflows (.github/workflows/)

This file provides specific guidance for working with GitHub Actions workflows and CI/CD pipelines.

## Overview

The `.github/workflows/` directory contains GitHub Actions workflow files that automate various tasks such as linting, testing, building, and deployment.

## Current Workflows

```
.github/workflows/
├── opencommit.yml           # Automated commit message generation
└── copilot-setup-steps.yml  # Copilot environment setup
```

## Workflow: OpenCommit (opencommit.yml)

### Purpose
Automatically generates commit messages using OpenCommit when commits are pushed to branches (except main/master/dev/development/release).

### Configuration

```yaml
name: "OpenCommit Action"

on:
  push:
    branches-ignore:
      - main
      - master
      - dev
      - development
      - release

jobs:
  opencommit:
    timeout-minutes: 10
    name: OpenCommit
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - name: Setup Node.js Environment
        uses: actions/setup-node@v6
        with:
          node-version: "25"
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: di-sukharev/opencommit@github-action-v1.0.4
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        env:
          OCO_AI_PROVIDER: "ollama"
          OCO_OLLAMA_API_URL: ${{ secrets.OLLAMA_API_URL }}
```

### Key Points

- **Branch Filtering:** Runs on all branches except protected branches
- **Node.js Version:** Uses Node.js 25
- **Permissions:** Requires write-all permissions to commit changes
- **Timeout:** 10-minute limit
- **AI Provider:** Uses Ollama for commit message generation

### Environment Variables

Required secrets:
- `GITHUB_TOKEN` - Automatically provided by GitHub
- `OLLAMA_API_URL` - Custom secret for Ollama API endpoint

## Workflow: Copilot Setup Steps (copilot-setup-steps.yml)

### Purpose
Sets up the development environment for GitHub Copilot workspace operations.

### Configuration

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "25"
          cache: "npm"

      - name: Install JavaScript dependencies
        run: npm ci
```

### Key Points

- **Job Name:** MUST be `copilot-setup-steps` (required by Copilot)
- **Triggers:** Manual dispatch, or when the workflow file itself changes
- **Node.js Version:** Uses Node.js 25 with npm caching
- **Dependencies:** Installs project dependencies with `npm ci`

## Best Practices for Workflows

### 1. Naming Conventions

```yaml
# Use descriptive names
name: "Deploy to Production"  # Good
name: "Deploy"                # Less clear

# Job names should be clear
jobs:
  deploy-production:  # Good
  deploy:            # Less clear
```

### 2. Permissions

Follow the principle of least privilege:

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
    permissions:
      contents: read      # Read repository contents
      pull-requests: write # Write to PRs
      # Only grant necessary permissions
```

Common permissions:
- `contents: read|write` - Repository contents
- `pull-requests: read|write` - Pull requests
- `issues: read|write` - Issues
- `deployments: write` - Deployments
- `packages: write` - GitHub Packages

### 3. Node.js Version

**CRITICAL:** This project requires Node.js >= 24.11.0

```yaml
- name: Set up Node.js
  uses: actions/setup-node@v6
  with:
    node-version: "25"  # Use 25 or "24" at minimum
    cache: "npm"        # Enable npm caching for faster builds
```

### 4. Caching

Enable caching to speed up workflows:

```yaml
# npm caching (automatic with setup-node)
- uses: actions/setup-node@v6
  with:
    node-version: "25"
    cache: "npm"

# Manual caching example
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      my-app/node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 5. Error Handling

```yaml
# Continue on error for non-critical steps
- name: Run linter
  run: npm run lint
  continue-on-error: true

# Fail fast for critical steps (default behavior)
- name: Run tests
  run: npm test
  # Workflow stops if this fails

# Conditional execution
- name: Deploy
  if: github.ref == 'refs/heads/main'
  run: npm run deploy
```

### 6. Secrets Management

```yaml
# Use secrets for sensitive data
env:
  API_KEY: ${{ secrets.API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# Never expose secrets in logs
- name: Deploy
  run: |
    echo "::add-mask::${{ secrets.API_KEY }}"
    deploy.sh
```

**Setting Secrets:**
1. Go to Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value

## Common Workflow Patterns

### Linting Workflow

```yaml
name: Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "25"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run HTML Lint (if applicable)
        run: npx htmllint public/*.html
```

### Testing Workflow

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [24, 25]
    steps:
      - uses: actions/checkout@v6

      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

### Build and Deploy Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "25"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js app
        run: |
          cd my-app
          npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Multi-Job Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "25"
          cache: "npm"
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint  # Wait for lint to complete
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "25"
          cache: "npm"
      - run: npm ci
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    needs: [lint, test]  # Wait for both lint and test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "25"
          cache: "npm"
      - run: npm ci
      - run: npm run deploy
```

## Workflow Triggers

### Push Trigger

```yaml
# Trigger on push to any branch
on: push

# Trigger on push to specific branches
on:
  push:
    branches:
      - main
      - develop
      - 'feature/*'

# Trigger on push, excluding certain branches
on:
  push:
    branches-ignore:
      - main
      - master

# Trigger on push to specific paths
on:
  push:
    paths:
      - 'src/**'
      - 'public/**'
      - 'package.json'
```

### Pull Request Trigger

```yaml
# Trigger on PR to specific branches
on:
  pull_request:
    branches:
      - main
      - develop

# Trigger on specific PR types
on:
  pull_request:
    types:
      - opened
      - synchronize
      - reopened
```

### Schedule Trigger

```yaml
# Run daily at midnight UTC
on:
  schedule:
    - cron: '0 0 * * *'

# Run every Monday at 9 AM UTC
on:
  schedule:
    - cron: '0 9 * * 1'
```

### Manual Trigger

```yaml
# Enable manual workflow dispatch
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
```

## Debugging Workflows

### Enable Debug Logging

Set secrets in repository:
- `ACTIONS_STEP_DEBUG`: `true` - Enable debug logging
- `ACTIONS_RUNNER_DEBUG`: `true` - Enable runner debug logging

### View Workflow Logs

1. Go to repository → Actions tab
2. Click on the workflow run
3. Click on job to view logs
4. Expand steps to see detailed output

### Common Issues

1. **Permission Denied**
   - Check job permissions
   - Verify GitHub token has required scopes

2. **Node.js Version Issues**
   - Ensure Node.js >= 24.11.0
   - Check `.nvmrc` file

3. **Dependency Installation Failures**
   - Clear npm cache: `npm cache clean --force`
   - Use `npm ci` instead of `npm install`

4. **Timeout Issues**
   - Increase timeout: `timeout-minutes: 30`
   - Optimize workflow (use caching, parallel jobs)

## Pre-commit Hooks Integration

This project uses extensive pre-commit hooks (`.pre-commit-config.yaml`). To run similar checks in CI:

```yaml
name: Pre-commit Checks

on: [push, pull_request]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install pre-commit
        run: pip install pre-commit

      - name: Run pre-commit
        run: pre-commit run --all-files
```

## MegaLinter Integration

To run MegaLinter in CI:

```yaml
name: MegaLinter

on: [push, pull_request]

jobs:
  megalinter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: MegaLinter
        uses: oxsecurity/megalinter@v8
        env:
          VALIDATE_ALL_CODEBASE: true
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [actions/setup-node](https://github.com/actions/setup-node)
- [actions/cache](https://github.com/actions/cache)
