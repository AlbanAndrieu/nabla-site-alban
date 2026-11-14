---
name: nabla-ci-debug
description: >-
  Diagnose failing CI, Preview, Playwright and security checks from the first actionable error without unnecessary reruns.
---
# CI triage

## Progressive evidence

Inspect the workflow, failing job, failing step and first actionable error before expanding logs. Never weaken valid tests.

1. Pin PR, branch and exact HEAD. Distinguish local workstation from remote connector-only agent (`AGENTS.md`).
2. Inspect failed workflow → job → step → first 20 useful log lines. Expand to traces/artifacts only if necessary.
3. Classify formatter, lint, type, unit, build, Preview, Playwright, ZAP or deployment separately; do not equate a downstream failure with a passing quality job.
4. For `QG_AUTOFIX_REQUIRED`, `QG_PRECOMMIT_FAILED`, `QG_FIX_OSCILLATION` and `QG_PUBLISH_*`, follow `nabla-quality` / `local-first-quality`. Never retry oscillating hooks or disable guards.
5. On an authorized workstation, reproduce the smallest failure with local tools; in a remote source-only agent, inspect exact-SHA tests and patches and report `NOT_RUN` for Node/browser/LAN.
6. Make one cohesive fix, verify HEAD and relevant checks. Never manually rerun paid GitHub Actions or add CI skip directives.

## Quota-constrained mode

Keep one coherent fix. Use local L1/L2, avoid manual hosted reruns and never treat a skipped CI check as successful.

When DNS/clone is unavailable, use an existing verified snapshot (see `nabla-maintenance`) or targeted connector reads. A snapshot is not a Git checkout; an absent ZAP report is not zero findings. Report `HEAD | first error | fix | proof L0-L3 | BLOCKED | next action`.
