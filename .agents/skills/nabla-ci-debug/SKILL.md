---
name: nabla-ci-debug
description: >-
  Diagnose hosted CI, Preview, Playwright, security, or quality failures with
  progressive evidence and minimal reruns. Use when a workflow/check is red or
  the user asks to fix CI.
---
# Nabla CI diagnosis

Use `AGENTS.md` as the authority. Diagnose before editing.

## Progressive evidence

Inspect in this order and stop as soon as the root cause is proven:

1. exact current branch and HEAD;
2. failing workflow/check status;
3. failing job;
4. failing step;
5. only the log lines around the first actionable error;
6. traces, screenshots, reports or full artifacts only when targeted logs are insufficient.

Do not fetch broad logs or artifacts first.

## Deterministic failures

Treat repository quality codes as instructions, not mysteries:

- `QG_AUTOFIX_REQUIRED` → switch to `nabla-quality` and run the local fix path;
- `QG_PRECOMMIT_FAILED` → inspect the named hook and affected files only;
- `QG_FIX_DID_NOT_CONVERGE` → stop retries and identify the unstable hook;
- `QG_PUBLISH_*` → publication is blocked until the stated invariant is repaired.

Do not manually rerun GitHub Actions to rediscover a deterministic local failure.

## Hosted failures

Separate the failing layer. A workflow can be red while its `quality` job is green because a downstream Preview, Playwright, ZAP, deployment or status-wait job failed.

For Playwright failures, capture the exact spec, locator/assertion, expected value and received value. Compare the test assumption with the current route/runtime before changing product code. Prefer repairing an obsolete or flaky contract when the product behavior is already correct; never weaken a valid accessibility/security assertion merely to obtain green CI.

## Quota-constrained mode

When Actions quota is constrained:

- never request a manual rerun for a badge;
- maximize local deterministic evidence;
- group fixes into one coherent push;
- record checks that could not run;
- treat remote CI as independent verification, not the primary debugger.

## Completion

Report the exact HEAD, root cause, files changed, local checks actually run, hosted checks observed for that HEAD, and any unresolved risk.
