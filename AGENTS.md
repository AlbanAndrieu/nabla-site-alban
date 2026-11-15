# Repository agent rules — Site Alban

Next.js 16 / React 19 / next-intl. Toolchain: `package.json`. Procedures: `docs/agent-policy-details.md`. Load one relevant skill.

## Execution profile

- **Workstation (Claude Code):** use checkout, cached deps, focused tests, Playwright FR/EN and strict publication. OWNER/LAN probes require authorized network/identity.
- **Remote (Codex/connector only):** inspect exact-SHA source/PR/contracts. Without Git, deps or LAN, builds/browser/OWNER/L3 are `NOT_RUN`; do not retry blocked network.
- `node scripts/agent-task-context.mjs --task homelab` reports `LOCAL_READY`, `LOCAL_LIMITED` or `REMOTE_SOURCE`; override with `AGENT_EXECUTION_MODE=remote|workstation`. Never infer LAN access.

## Efficient work loop

1. **OBSERVE:** run `just context` / `just preflight`; before editing inspect PR overlaps via `node scripts/agent-pr-guard.mjs --paths FILE ...` (or connector). Reuse open PR; pin HEAD/base.
2. **ROUTE:** load one `.agents/skills/*/SKILL.md` and its nearest contract.
3. **CHANGE:** synchronize the selected PR with `master` before editing, resolve real conflicts, then make one coherent batch; inspect changed paths and first failed test, not full logs.
4. **FIX:** `npm run quality:agent:fix` only on a complete local checkout.
5. **REVIEW:** verify diff, privacy, a11y, security and regressions.
6. **PROVE:** after commit on clean Node 24/npm 12 checkout run `npm run quality:agent:publish` then `npm run quality:agent:publish -- --status`; source-only L0/L1 is not L3.
7. **PUBLISH:** one Draft PR on a non-default branch with exact-SHA evidence. If L3 unavailable, explicitly report `NOT_RUN` and keep Draft.

## Security and publication invariants

Never push, delete, merge or write `master`; never merge without explicit approval. Never force-push, use `--no-verify`, `[skip ci]`, weaken security/quality gates or bypass pre-commit. Do not manually run paid GitHub Actions under quota constraints; Draft does not suppress push-triggered CI. API writes require the correct branch, fresh file SHA and PR HEAD; block overlapping open PRs, stale base, conflicting writer, dirty proof or scope creep. Never reuse merged PR branches.

**Batch publication:** do not push minor follow-up changes individually; accumulate
one validated patch set in the existing PR. Exception: an urgent production
stability/security fix requiring deployment, or a completed migration with
all affected services updated. No auto-merge or bypass of any required gate.

Post-merge remediation is recovery only; it never substitutes for the publication quality gate. Never print secrets or OWNER payloads. A denied probe or missing evidence is not a healthy service.

## React and architecture invariants

Keep default English URLs unprefixed and French under `/fr`; preserve next-intl parity, SEO, keyboard, WCAG 2.2 AA, 320/390 px, privacy and OWNER/SERVICE boundaries. `Declared` is not `Observed` or `Healthy`. Do not invent catalog edges, healthy probes or links. Keep `entityRef` and `catalogRevision` consistent.

Refactor at **300 lines** (warning/review) and **600 lines** (split required), enforced by `scripts/check_code_size.py`. Preserve the protected `public/404.html` static rendering via `app/global-not-found.tsx` and its HTTP 404/noindex behavior; do not migrate it to native React without approval.

## On-demand routing

- Quality/CI: `.agents/skills/local-first-quality/SKILL.md`, `.agents/skills/nabla-ci-debug/SKILL.md`.
- Site catalog/OWNER: `.agents/skills/nabla-service-catalog/SKILL.md` and `docs/homelab-services-catalog.md`.
- UI, a11y, SEO: `docs/agent-frontend-standards.md`.
- Full exceptions/publish/404/NDA: `docs/agent-policy-details.md` and `.agents/skills/nabla-nda-guard/SKILL.md`.
- Mapping/tests: `docs/agent-developer-guide.md`. Roadmaps: `docs/quality-roadmap.md`, `docs/homelab-roadmap.md`.
- Next docs: `node_modules/next/dist/docs/` only; load on demand.

## Claude and Codex

Both use this file. `CLAUDE.md` remains exactly `@AGENTS.md` and `.claude/skills/*` are symlinks to `.agents/skills/*`; no copied policies. Use one `git worktree` per agent. Do not edit another agent's working tree or share writable build directories.

Report only changed paths, PR and exact HEAD, L0/L1/L2/L3 actually executed, `NOT_RUN`/`BLOCKED`, risks and next action. Roadmap=open; runbook=procedure; incident=history; contract=invariant; Git=chronology.
