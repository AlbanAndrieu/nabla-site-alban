---
name: nabla-roadmap-loop
description: >-
  Advance the Site Alban roadmaps in owner-approved sprint mode. Implement as
  many items as possible without per-item approval, one Draft PR, questions only
  after five full passes, and a reconciliation cycle every third pass.
---
# Nabla roadmap loop — Site Alban

Adapted from the nabla-compose skill of the same name (owner decision of
21/11/2026, renewed on 27/11/2026: "implement as much of the roadmap as
possible without asking me"). The homelab side (TrueNAS, OpenTofu, App
restarts) stays in nabla-compose; this repository only ships the site.

## Authority

Do without asking: implement items with their tests, refactor, update
roadmaps/runbooks/skills, commit on the PR branch, run the strict local gate
and push the PR.

Still never: print or commit a secret; bypass a hook, gate or scanner; write
to `master` or force-push; merge a PR or mark it Ready; manually dispatch paid
GitHub Actions; open a public exposure, weaken auth or the OWNER/SERVICE
boundary; change the payment flow, legal texts or the protected
`public/404.html` without an owner decision. Such a step becomes a parked
question; keep going with the rest.

## One PR

Reuse the open PR (`gh pr list --author @me --state open`); with none, create
`feat/roadmap-<YYYYMMDD>` from an up-to-date `master`. Batch every pass into
it, push once per verified batch, keep it Draft.

## The loop

A pass walks `docs/quality-roadmap.md`, `docs/homelab-roadmap.md` and the
roadmaps they link (`docs/stripe-hardening-roadmap.md`, ...). For each item:

1. `git fetch`; skip what `origin/master` or another open PR already covers
   (`node scripts/agent-pr-guard.mjs --paths FILE ...`).
2. Smallest complete change plus its test; run the focused L1/L2 test.
3. Record `CODED`, `TESTED`, `DEPLOYED` or `ACCEPTED` with the SHA in the
   roadmap line. Merge and Vercel deploy belong to the owner: never claim
   `DEPLOYED` from a push.
4. Blocked by a credential, LAN access, a paid plan or an owner decision: park
   it in the state runbook and move on. Owner-deprioritized items (FinOps A4
   since 27/11) are skipped, not parked.

Ask the parked questions once, in plain text, after five full passes or when
only blocked items remain.

Every third pass, reconcile in this order: roadmaps (one line per ID, close
done items, no duplicated narrative), skills and `AGENTS.md` (fold lessons,
delete what proved wrong), stale runbooks/READMEs, then dead code and
duplication with tests.

## Proof per push

`npm run quality:agent:fix`, commit, then on the clean tree
`npm run quality:agent:publish` and `-- --status`. Report L0–L3 executed and
`NOT_RUN` honestly (browser OWNER/SERVICE, real backends).

## Pitfalls

- The shell `node` may be v20: prepend
  `$(dirname $(mise which node)):$(dirname $(mise which npm))` to `PATH`;
  `mise exec` alone still mixed Node 20 with npm 12 and rewrote `mise.lock`.
- The Playwright dev server rewrites `next-env.d.ts`: restore it before commit.
- Stash the owner's `.claude/settings.local.json` and `.claude/security/`
  (after `git reset`) before the fix/publish gates, pop afterwards.
- Source-contract tests read component files by path: when extracting a
  module, point them at the new file without dropping assertions.
- Playwright on WebKit: a `fill` before hydration never reaches React state,
  and refilling the same value fires no change; clear, then retry with
  `expect(...).toPass()`.
- One `next dev` per checkout: a second Playwright run fails to start its
  web server. Parallel cold compiles also fail `request.get` checks (seen on
  Firefox SEO); rerun with `--workers=1` before calling it a site defect.
- Unit contracts also read Playwright specs (`accessibilityKeyboardContract`):
  run `npm run test:unit` after editing a spec, before the publish gate.
- Run the a11y suite on the mobile projects too: Chromium desktop was green
  while mobile Axe found scroll-region and contrast defects.

## State outside the context

Track pass counter, current item and parked questions in
`docs/runbooks/<date>-roadmap-loop-state.md` on the PR branch; update it after
each item.
