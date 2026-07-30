# GitHub Actions Best Practices

This document provides comprehensive guidelines for creating, maintaining, and optimizing GitHub Actions workflows for the Nabla site project.

## Table of Contents

1. [Overview](#overview)
2. [Security Best Practices](#security-best-practices)
3. [Performance Optimization](#performance-optimization)
4. [Workflow Design Patterns](#workflow-design-patterns)
5. [Error Handling and Debugging](#error-handling-and-debugging)
6. [Testing Strategies](#testing-strategies)
7. [Maintenance and Monitoring](#maintenance-and-monitoring)
8. [Examples and Templates](#examples-and-templates)

## Overview

GitHub Actions is our SDLC platform for automating builds, tests, and deployments. This guide ensures workflows are:
- **Secure**: Following security best practices
- **Efficient**: Optimized for speed and cost
- **Reliable**: Handling errors gracefully
- **Maintainable**: Easy to understand and update

## Security Best Practices

### 1. Principle of Least Privilege

Always specify minimal required permissions for each job:

```yaml
# Bad: Using default permissions
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4

# Good: Explicitly limiting permissions
jobs:
  build:
    runs-on: ubuntu-24.04
    permissions:
      contents: read  # Only needs to read repository content
    steps:
      - uses: actions/checkout@v4
```

**Default Permissions to Avoid**:
```yaml
# Avoid this at workflow or job level
permissions: write-all
```

**Common Permission Levels**:
- `contents: read` - Read repository files
- `contents: write` - Write to repository (commits, tags)
- `pull-requests: write` - Comment on PRs
- `deployments: write` - Create deployments
- `actions: read` - Read workflow runs
- `checks: write` - Create status checks

### 2. Pin Actions to Specific Versions

**Always use commit SHA or major version tags**:

```yaml
# Best: Pin to commit SHA (immutable)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1

# Good: Pin to major version (gets security updates)
- uses: actions/checkout@v4

# Bad: Using branch name (mutable, insecure)
- uses: actions/checkout@main
```

**Why Pin Actions?**
- Prevents supply chain attacks
- Ensures reproducible builds
- Protects against breaking changes
- Allows controlled upgrades

**Recommended Format**:
```yaml
- uses: actions/checkout@v4  # Major version with comment
  # SHA: b4ffde65f46336ab88eb53be808477a3936bae11 (v4.1.1)
```

### 3. Secure Secret Management

**Never expose secrets in logs or outputs**:

```yaml
# Bad: Secret could be exposed in logs
- name: Deploy
  run: echo "Token: ${{ secrets.DEPLOY_TOKEN }}"

# Good: Use secret without exposing it
- name: Deploy
  run: ./deploy.sh
  env:
    DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

**Best Practices for Secrets**:
1. Use GitHub Secrets (Settings → Secrets and variables → Actions)
2. Never log secret values
3. Use environment variables, not command-line arguments
4. Rotate secrets regularly
5. Use different secrets for different environments
6. Limit secret access with environment protection rules

**Environment-Specific Secrets**:
```yaml
jobs:
  deploy:
    runs-on: ubuntu-24.04
    environment: production  # Uses production secrets
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.PROD_API_KEY }}
        run: ./deploy.sh
```

### 4. Validate Inputs

For workflow_dispatch and reusable workflows, validate all inputs:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-24.04
    steps:
      - name: Validate environment
        run: |
          if [[ ! "${{ inputs.environment }}" =~ ^(development|staging|production)$ ]]; then
            echo "Invalid environment: ${{ inputs.environment }}"
            exit 1
          fi
```

### 5. Secure Third-Party Actions

**Audit before using**:
1. Check action's repository for security issues
2. Review action's code for suspicious behavior
3. Verify action's GitHub account reputation
4. Check number of stars and usage
5. Pin to specific version/SHA

**Prefer Official Actions**:
- `actions/*` - GitHub's official actions
- `vercel/*` - Vercel's official actions
- Community actions with high reputation

### 6. Prevent Script Injection

**Dangerous pattern** (vulnerable to script injection):
```yaml
# Bad: User input could inject malicious code
- name: Print PR title
  run: echo "PR: ${{ github.event.pull_request.title }}"
```

**Safe pattern**:
```yaml
# Good: Use environment variables
- name: Print PR title
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "PR: $PR_TITLE"
```

### 7. Use GitHub's GITHUB_TOKEN

For repository operations, prefer `GITHUB_TOKEN` over personal access tokens:

```yaml
- name: Create comment
  uses: actions/github-script@v7
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: 'Deployment successful!'
      })
```

## Performance Optimization

### 1. Caching Dependencies

**Cache npm dependencies**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Automatically caches npm dependencies
```

**Manual caching** (example: Playwright browser binaries):
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-playwright-
```

**Cache Best Practices**:
- Cache expensive operations (downloads, compilations)
- Use specific cache keys with file hashes
- Provide restore-keys for partial cache hits
- Set reasonable cache retention (default: 7 days)
- Don't cache secrets or credentials

### 2. Parallelization with Matrix Builds

Run tests across multiple configurations simultaneously:

```yaml
jobs:
  test:
    runs-on: ubuntu-24.04
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-24.04, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

**Matrix Best Practices**:
- Use for testing across multiple versions
- Limit matrix size to control costs (max 256 jobs)
- Use `fail-fast: false` to see all failures
- Use `max-parallel` to limit concurrent jobs

### 3. Job Dependencies and Artifacts

Use artifacts to share data between jobs:

```yaml
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build  # replace with your site/app build command
      - uses: actions/upload-artifact@v4
        with:
          name: site-build
          path: dist/  # adjust to your build output directory
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: site-build
          path: dist/
      - run: ./deploy.sh
```

**Artifact Best Practices**:
- Use short retention periods (1-7 days)
- Compress large artifacts before uploading
- Use specific paths to avoid uploading unnecessary files
- Clean up artifacts with API after use

### 4. Conditional Execution

Skip unnecessary jobs with conditionals:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-24.04
    # Only deploy on push to main branch
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Deploy
        run: ./deploy.sh

  test:
    runs-on: ubuntu-24.04
    steps:
      - name: Run tests
        run: npm test

      - name: Upload coverage
        # Only upload coverage if tests passed
        if: success()
        run: ./upload-coverage.sh
```

**Common Conditionals**:
```yaml
if: success()                    # Previous steps succeeded
if: failure()                    # Previous steps failed
if: always()                     # Always run (e.g., cleanup)
if: cancelled()                  # Workflow was cancelled
if: github.ref == 'refs/heads/main'  # Specific branch
if: github.event_name == 'pull_request'  # PR events only
```

### 5. Optimize Checkout

For builds that don't need full history:

```yaml
# Fast: Shallow clone (default)
- uses: actions/checkout@v4

# Full history (needed for certain git operations)
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

# With submodules
- uses: actions/checkout@v4
  with:
    submodules: recursive
```

### 6. Use Self-Hosted Runners (Advanced)

For large teams with high usage:
- Faster builds (no queue time)
- Custom hardware/software
- Lower costs for high-volume usage
- Requires maintenance and security considerations

### 7. Concurrent Workflows

Control concurrent workflow runs:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel old runs when new one starts
```

**Use Cases**:
- Deployment workflows (only deploy latest version)
- Resource-intensive workflows
- Workflows that modify shared state

## Workflow Design Patterns

### 1. Build-Test-Deploy Pattern

Standard three-phase workflow:

```yaml
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  test:
    needs: build
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/
      - name: Test
        run: npm test

  deploy:
    needs: [build, test]
    runs-on: ubuntu-24.04
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/
      - name: Deploy
        run: ./deploy.sh
```

### 2. Reusable Workflows

Create reusable workflows for common patterns:

```yaml
# .github/workflows/reusable-deploy.yml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      deploy_token:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-24.04
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          TOKEN: ${{ secrets.deploy_token }}
        run: ./deploy.sh ${{ inputs.environment }}

# .github/workflows/main.yml
jobs:
  deploy-prod:
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: production
    secrets:
      deploy_token: ${{ secrets.PROD_TOKEN }}
```

### 3. Composite Actions

Create custom actions for repeated steps:

```yaml
# .github/actions/setup-env/action.yml
name: 'Setup Environment'
description: 'Setup Node.js and install dependencies'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
      shell: bash

# Use in workflow
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-env
      - run: npm run build
```

### 4. Path Filtering

Only run workflows when relevant files change:

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'package.json'
      - 'package-lock.json'
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### 5. Manual Trigger with Inputs

Allow manual workflow execution with parameters:

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true
        default: 'latest'
      dry_run:
        description: 'Perform dry run'
        required: false
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: |
          echo "Deploying version: ${{ inputs.version }}"
          if [ "${{ inputs.dry_run }}" == "true" ]; then
            echo "Dry run mode - no actual deployment"
          else
            ./deploy.sh ${{ inputs.version }}
          fi
```

## Error Handling and Debugging

### 1. Continue on Error

```yaml
- name: Lint code
  run: npm run lint
  continue-on-error: true  # Don't fail workflow if linting fails
```

### 2. Timeout Protection

```yaml
jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 30  # Fail if job runs longer than 30 minutes
    steps:
      - name: Run tests
        run: npm test
        timeout-minutes: 15  # Fail if step runs longer than 15 minutes
```

### 3. Debug Logging

Enable debug logging for troubleshooting:

```yaml
- name: Debug information
  run: |
    echo "Branch: ${{ github.ref }}"
    echo "Event: ${{ github.event_name }}"
    echo "Actor: ${{ github.actor }}"
    echo "Working directory: $(pwd)"
    ls -la
```

**Enable Runner Diagnostic Logging**:
1. Go to repository Settings → Secrets
2. Add secret: `ACTIONS_RUNNER_DEBUG` = `true`
3. Add secret: `ACTIONS_STEP_DEBUG` = `true`

### 4. Step Outputs

Pass data between steps:

```yaml
- name: Set deployment time
  id: time
  run: echo "time=$(date +'%Y-%m-%d %H:%M:%S')" >> $GITHUB_OUTPUT

- name: Use output
  run: echo "Deployed at ${{ steps.time.outputs.time }}"
```

### 5. Status Checks

Add status checks to PRs:

```yaml
- name: Post status
  uses: actions/github-script@v7
  if: always()
  with:
    script: |
      github.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha: context.sha,
        state: '${{ job.status }}',
        context: 'Build Status',
        description: 'Build completed'
      })
```

## Testing Strategies

### 1. Test Different Scenarios

```yaml
jobs:
  test:
    runs-on: ubuntu-24.04
    strategy:
      matrix:
        test-suite:
          - unit
          - integration
          - e2e
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:${{ matrix.test-suite }}
```

### 2. Test in Pull Requests

```yaml
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
        with:
          # For PRs, checkout the PR head
          ref: ${{ github.event.pull_request.head.sha }}
      - run: npm test
```

### 3. Required Status Checks

Configure branch protection rules:
1. Settings → Branches → Branch protection rules
2. Require status checks to pass before merging
3. Select which workflows are required

### 4. Coverage Reporting

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    file: ./coverage/coverage.xml
    fail_ci_if_error: true
```

## Maintenance and Monitoring

### 1. Keep Actions Updated

Use Dependabot to keep actions up to date:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "github-actions"
```

### 2. Monitor Workflow Usage

- Review GitHub Actions usage in Settings → Billing
- Set up spending limits if needed
- Monitor workflow run times
- Optimize long-running workflows

### 3. Workflow Naming and Documentation

```yaml
name: CI — Build and test  # Clear, descriptive name

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

# Document workflow purpose at the top
# This workflow:
# 1. Installs dependencies
# 2. Runs the build and/or tests
# 3. Optionally uploads artifacts or deploys

jobs:
  build:
    name: Build and verify  # Clear job name
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout code  # Clear step name
        uses: actions/checkout@v4
```

### 4. Notification Strategy

```yaml
- name: Notify on failure
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: '❌ Deployment failed. Please check the logs.'
      })
```

## Examples and Templates

### Example 1: Playwright end-to-end tests (this repository)

See `.github/workflows/playwright.yml` for a workflow that follows these practices (checkout, Node setup with npm cache, Playwright install, test run, artifact upload on failure).

Key features:
- ✅ Pinned action versions
- ✅ Minimal permissions
- ✅ npm caching via `actions/setup-node`
- ✅ Clear job and step names
- ✅ Test reports as artifacts

### Example 2: Linting Workflow

```yaml
name: Lint Code

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-24.04
    permissions:
      contents: read
      pull-requests: write  # For PR comments
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run ESLint
        run: npm run lint -- --format json --output-file eslint-report.json
        continue-on-error: true

      - name: Annotate PR
        if: github.event_name == 'pull_request'
        uses: ataylorme/eslint-annotate-action@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          report-json: eslint-report.json
```

### Example 3: Playwright E2E Testing

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Quick Reference Checklist

Before creating or updating workflows, verify:

- [ ] Minimal permissions specified
- [ ] Actions pinned to specific versions
- [ ] Secrets not exposed in logs
- [ ] Caching configured for dependencies
- [ ] Timeout limits set
- [ ] Clear job and step names
- [ ] Conditional execution where appropriate
- [ ] Artifacts cleaned up appropriately
- [ ] Error handling implemented
- [ ] Path filtering for efficiency
- [ ] Branch protection rules configured
- [ ] Documentation updated

## Additional Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Security Hardening Guide**: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- **Workflow Syntax**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **GitHub Actions Marketplace**: https://github.com/marketplace?type=actions
- **Project workflows**: `.github/workflows/`

## Support

For issues specific to this project:
- **GitHub Issues**: Open an issue in this repository
- **Email**: alban.andrieu@albandrieu.com
