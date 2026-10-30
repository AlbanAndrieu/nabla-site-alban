# Repository agent rules — Site Alban

**Purpose:** a short, enforceable map, not a manual. Load one task-specific skill or runbook.
Full procedures and protected exceptions: `docs/agent-policy-details.md`.
Next.js 16 / React 19 / TypeScript / next-intl; `package.json` defines Node/npm.

## Efficient local-first loop

1. **OBSERVE:** `just context`, then `just preflight`; pin PR, HEAD and base SHA.
   Use `just agent-context ui|agent|ci|homelab|security` for a bounded task hint (not proof).
2. **ROUTE:** open only the matching `.agents/skills/nabla-*/SKILL.md`,
   `.agents/skills/local-first-quality/SKILL.md`, or frontend standards.
3. **CHANGE:** one cohesive batch; read only relevant code, first failed test and diff.
4. **FIX:** `npm run quality:agent:fix` until deterministic convergence.
5. **REVIEW:** inspect changed paths and the first failing check, not entire logs.
6. **PROVE:** on a clean committed checkout run `npm run quality:agent:publish`
   and `npm run quality:agent:publish -- --status` (exact HEAD/base/toolchain).
7. **PUBLISH:** update one Draft PR on a non-default branch after verification.

Never retry blocked GitHub, DNS, npm or codeload endpoints without changed prerequisites.
An exact-SHA source-only snapshot lacks `.git` and `node_modules`: not a publication proof.
Node 22/npm 10: `just node22-fast` gives L1 only; Node 24/npm 12 L3 is mandatory.
Never claim build, browser, Axe or full quality gate success from source inspection.

## Security and publication invariants

Never write, push, delete or merge `master`. Never merge a PR without explicit approval.
Never force-push, use `--no-verify`, `[skip ci]` or other skip directives,
weaken SAST/DAST/secrets/tests, or bypass pre-commit. Keep PRs Draft while incomplete.
Do not manually dispatch paid GitHub Actions during the zero-credit period.
Draft does **not** guarantee push-triggered workflows are suppressed; inspect filters.
Remote API edits require explicit branch, current blob SHA and fresh PR HEAD check.
If no full checkout exists, validate narrowly, mark L3 `NOT_RUN`, keep the PR Draft.
Stop on stale base, changed HEAD, dirty proof, oscillation or scope creep.
Post-merge remediation is recovery only: the workflow file exists on the default branch
before `workflow_run` becomes active. Agents must never rely on this post-merge workflow
to justify a failed or unexecuted publication gate.

## React and architecture invariants

Preserve default English (unprefixed), `/fr`, i18n parity, SEO, keyboard WCAG 2.2 AA,
privacy and OWNER/SERVICE trust boundaries. `Declared` is not `Observed` or `Healthy`.
Prefer bounded, cache-aware, non-blocking API reads for homelab pages.
Refactor at **400 lines (warning/review)** and **700 lines (split required)** for code
and configuration. Avoid new monoliths; retain public contract tests.
Keep legacy `public/404.html` as the custom 404 rendering source through
`app/global-not-found.tsx`; never replace it with native React, remove its styles
or change HTTP 404/noindex without explicit approval.

## On-demand routing (do not preload)

- Full hooks, publication, offline and 404 rules: `docs/agent-policy-details.md`.
- CI triage and L0–L3 proofs: `.agents/skills/local-first-quality/SKILL.md`.
- Frontend, a11y, i18n, SEO, responsive: `docs/agent-frontend-standards.md`.
- Project map / single tests: `docs/agent-developer-guide.md`.
- Node22 offline L1: `docs/runbooks/node22-fast-local.md`.
- Roadmaps: `docs/quality-roadmap.md` and `docs/homelab-roadmap.md`.
- Next.js: only targeted installed `node_modules/next/dist/docs/` guides.
- OpenCode V1/V2: verify installed version before schema changes.

## Compact evidence report

Report changed paths, PR, exact SHA, L0/L1/L2/L3 checks executed, `NOT_RUN`/`BLOCKED`,
risks and one next action. Keep full logs private. Roadmap=open; runbook=procedure;
incident=history; contract=invariant; Git=chronology. Do not duplicate narratives.
