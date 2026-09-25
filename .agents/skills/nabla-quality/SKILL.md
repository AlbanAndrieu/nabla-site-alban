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

Treat the machine-readable outcomes as a decision API:

- `QG_AUTOFIX_REQUIRED` → run the fix phase, review the deterministic diff, commit it, then retry publication;
- `QG_PRECOMMIT_FAILED` → inspect only the failing hook and the files it names;
- `QG_FIX_DID_NOT_CONVERGE` → stop automatic retries and identify the mutating/failing hook;
- `QG_PUBLISH_PROOF_MISSING` / `QG_PUBLISH_PROOF_STALE` → run the strict publication command once; do not pretend the old proof is valid;
- any other `QG_PUBLISH_*` failure → block publication and repair the stated invariant.

For semantic/type/test/security failures, inspect the failing command and affected files only. Do not manually rerun hosted GitHub Actions to diagnose a deterministic local failure.
