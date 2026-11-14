# Repository agent rules — Site Alban

Next.js 16 / React 19 / TypeScript / next-intl. Node/npm versions are pinned in `package.json`. This is the short bootstrap; procedures live in `docs/agent-policy-details.md`. Load **one** matching skill, not every guide.

## Execution profile

- **Workstation (Claude Code):** with a real Git checkout, use local CPUs, cached dependencies, focused Node tests, Playwright FR/EN and the strict publication gate. Run OWNER/LAN probes only when network and identity are actually authorized.
- **Remote (Codex/connector only):** review exact-SHA source, PR, tests, contracts, scripts and docs. Without `.git`, deps or LAN, mark builds/browser/OWNER/L3 `NOT_RUN`; do not retry blocked DNS, clone, npm or LAN requests.
- `node scripts/agent-task-context.mjs --task homelab` selects `LOCAL_READY`, `LOCAL_LIMITED` or `REMOTE_SOURCE` from checkout/deps; override with `AGENT_EXECUTION_MODE=remote|workstation`. **Never infer LAN access** from any local profile.

## Efficient work loop

1. **OBSERVE:** `just context`, `just preflight` only if a checkout exists; pin current PR, HEAD/base SHA.
2. **ROUTE:** read the one relevant `.agents/skills/*/SKILL.md` and the closest contract.
3. **CHANGE:** one coherent batch; inspect changed paths and first failed test, not full logs.
4. **FIX:** `npm run quality:agent:fix` only on a complete local checkout.
5. **REVIEW:** verify diff, privacy, security, a11y and regression tests.
6. **PROVE:** after commit on clean Node 24/npm 12 checkout run `npm run quality:agent:publish` then `npm run quality:agent:publish -- --status`; source-only L0/L1 is not L3.
7. **PUBLISH:** one Draft PR on a non-default branch with exact-SHA evidence. If L3 unavailable, explicitly report `NOT_RUN` and keep Draft.

## Security and publication invariants

Never push, delete, merge or write `master`; never merge without explicit approval. Never force-push, use `--no-verify`, `[skip ci]`, weaken security/quality gates or bypass pre-commit. Do not manually run paid GitHub Actions under quota constraints; Draft does not suppress push-triggered CI. API writes require the correct branch, fresh file SHA and PR HEAD; stop on stale base, conflicting writer, dirty proof or scope creep.

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
- Next docs only under installed `node_modules/next/dist/docs/`; do not preload vendor docs.

## Claude and Codex

Both use this file. `CLAUDE.md` remains exactly `@AGENTS.md` and `.claude/skills/*` are symlinks to `.agents/skills/*`; no copied policies. Use one `git worktree` per agent. Do not edit another agent's working tree or share writable build directories.

Report only changed paths, PR and exact HEAD, L0/L1/L2/L3 actually executed, `NOT_RUN`/`BLOCKED`, risks and next action. Roadmap=open; runbook=procedure; incident=history; contract=invariant; Git=chronology.
