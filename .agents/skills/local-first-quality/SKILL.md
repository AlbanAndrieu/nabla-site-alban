---
name: local-first-quality
description: >-
  Validate Site Alban changes with exact-HEAD, minimal local tests, and honest L0-L3 evidence.
---
# Local-first quality

Follow `AGENTS.md`. Use concise French reports inspired by ASD-STE100: one action per step, precise verbs and consistent technical terms. Do not claim certification to the English-language standard.

## Route by resources

| Capability | Execute | Never claim |
| --- | --- | --- |
| Claude Code workstation, full checkout, deps | `just context`, `just preflight`, focused test, `npm run quality:agent:fix`, review, commit, `npm run quality:agent:publish` and `-- --status` | L3 before actual exact-HEAD proof |
| Git checkout, no deps or only Node22/npm10 | `node scripts/agent-node22-fast.mjs --preflight` then `npm run test:fast:local` (dependency-free L1), syntax checks | build, typecheck, browser, L3 |
| Remote Codex, connector-only/source snapshot | exact-SHA source/PR/contract inspection (L0); targeted executable tests only if files/imports exist | workstation resources, LAN identity, preview/browser, L3 |

L0 = inspection, L1 = focused tests, L2 = deterministic local convergence, L3 = clean committed HEAD publication gate. Missing tools/deps/network are `NOT_RUN` or `BLOCKED`, never `PASS`. No GitHub Actions manual reruns or skip directives.

## Existing PR first and no micro-push

Before any edit, inspect the matching PR's HEAD/base and
`agent-pr-guard` result; rebase or reviewed non-force merge its base
**before** adding new changes. Preserve all concurrent changes, and
publish only a cohesive validated batch after the strict L3 gate.
Immediate rollout is reserved for an urgent production security/stability
fix or a completed migration requiring coordinated dependent updates.
For conflict recovery read the [conditional procedure](../../../docs/agent-policy-details.md).
Never auto-merge, force-push or disable CI/security controls.

## Local batch

1. Confirm PR/branch/base/HEAD, `git status --short` and affected files. Run the read-only `node scripts/agent-pr-guard.mjs --paths FILE ...` before editing; switch to a matching open PR instead of creating a duplicate. Work in an isolated `git worktree`.
2. Run one nearby test first. Expand only from the first actionable failure; keep full logs outside model context.
3. Run `npm run quality:agent:fix` after the **last edit**. Inspect the deterministic diff. Stop on `QG_FIX_OSCILLATION` or any security failure.
4. Commit the cohesive batch. Run `npm run quality:agent:publish` on Node24/npm12 with locked dependencies; check `npm run quality:agent:publish -- --status`. Never use `--no-verify`.
5. Re-check `just pr-guard` and exact remote PR HEAD before the push; a non-fast-forward push or unexpected PR overlap blocks publication. Push once to the PR's non-default branch, verify same HEAD and report checks actually run.

`QG_AUTOFIX_REQUIRED`: run the fixer; `QG_PRECOMMIT_FAILED`: inspect named hook; `QG_PUBLISH_*`: block publication until repaired. Never change tests just to silence a valid failure.

## UI and homelab acceptance

Use `docs/agent-frontend-standards.md` for React, WCAG 2.2 AA, FR/EN, mobile, SEO and theme. On an authorized workstation run matching Playwright/Axe; for OWNER/LAN versus SERVICE/WAN use `just audit-owner` / `just audit-service` only on the real network and never spoof IP headers. Vercel READY is not functional acceptance. Source-only checks do not prove caching/redaction or live service health.

## Remote and quota

A verified exact-SHA source snapshot may support L1 checks, but without `.git` it cannot prove L3. If network access fails, use targeted connector reads; no repeated clone/DNS/npm or CI reruns. Keep Draft, recheck HEAD before API write, and disclose missing proof. For full NDA, 404 and hook exceptions read `docs/agent-policy-details.md`. External UI skills must be installed manually with owner approval; do not run `npx skills add` autonomously.
