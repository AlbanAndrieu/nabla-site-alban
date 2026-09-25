---
name: quality-local-first
description: Use for CI, formatter, lint, quality-gate, pre-push, publication-proof, or GitHub Actions cost problems. Drives the repository's deterministic local-first fix and publish workflow without weakening checks.
compatibility: nabla-site-alban repository
metadata:
  authority: AGENTS.md
  scripts: scripts/agent-quality-gate.sh,scripts/agent-publish.sh,scripts/quality-gate.sh
---

# Local-first quality workflow

## Authority

`AGENTS.md` remains authoritative. This skill is an operational decision tree for the existing repository scripts; it must not create alternate quality rules.

## Inspect first

Run only:

```bash
git branch --show-current
git status --short
git diff --stat
```

Stop before any remote mutation if the branch is `master`.

## Deterministic fix phase

Run:

```bash
npm run quality:agent:fix
```

Interpret outcomes exactly:

- success with rewritten files: inspect the short diff, keep the intended deterministic fixes, and commit the complete batch;
- `QG_AUTOFIX_REQUIRED`: this is a fix instruction, not a reason to inspect broad CI logs;
- `QG_PRECOMMIT_FAILED`: inspect only the failing hook and files it names;
- `QG_FIX_DID_NOT_CONVERGE`: identify the hook that keeps mutating or failing; do not loop indefinitely.

After a fix pass, use `git status --short`, `git diff --stat`, and a targeted diff. Do not scan unrelated files.

## Strict publication phase

Only after the intended batch is committed and the tree is clean:

```bash
npm run quality:agent:publish
```

The publisher binds its reusable proof to the exact committed HEAD, resolved comparison-base SHA, and local toolchain fingerprint. A reused proof is valid only when those inputs are unchanged.

Any `QG_PUBLISH_*` failure blocks publication. Repair the reported invariant; never use `--no-verify` and never bypass the gate by writing through an API.

## CI-cost rule

Prefer local deterministic evidence. Do not manually rerun GitHub Actions to discover formatter, lint, type, unit, executable-bit, or other failures already covered by repository scripts. Use remote CI as independent verification when it runs, not as the first debugger.

## Completion evidence

Report:

1. current branch and commit tested;
2. commands actually executed;
3. whether the tree is clean;
4. exact `QG_*` result when present;
5. checks intentionally not run and why.
