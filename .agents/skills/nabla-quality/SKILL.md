---
name: nabla-quality
description: >-
  Run the repository's local-first quality workflow. Use before
  committing/pushing, when QG_* errors appear, or when GitHub Actions quota is
  limited and the exact local publication proof is important.
---
# Nabla local-first quality

Use the repository scripts; do not recreate their checks manually.

## Editing batch

```bash
npm run quality:agent:fix
git status --short
git diff --stat
git diff -- <affected-paths>
```

If the fixer changes files, review them, include the deterministic fixes in the intended commit, and rerun the fix phase until it converges.

## Strict publication proof

After the complete batch is committed:

```bash
npm run quality:agent:publish
npm run quality:agent:publish -- --status
```

The first command runs or reuses the strict HEAD/base/toolchain proof. The status command audits an existing proof without rerunning lint/tests/build.

Never publish a dirty tree. Never use `--no-verify`. Never weaken lint, tests, security controls, executable-bit checks, or destructive-diff guards.

For `QG_AUTOFIX_REQUIRED`, run the fix phase rather than debugging broad CI logs. For semantic/type/test/security failures, inspect the failing command and affected files only.
