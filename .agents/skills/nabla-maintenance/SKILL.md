---
name: nabla-maintenance
description: >-
  Continue Site Alban roadmap or PR with bounded context, targeted proof and minimal GitHub Actions usage.
---
# Site Alban maintenance — one batch at a time

1. Detect execution mode in `AGENTS.md`. **Before edits**, inventory open PRs, choose a compatible existing PR, compare its files and pin HEAD/base. On workstation: `node scripts/agent-pr-guard.mjs --paths FILE ...`; connector-only: GitHub PR/file listing. If listing is blocked, do not assume no PR exists.
2. Read the relevant item in `docs/quality-roadmap.md` or `docs/homelab-roadmap.md` and **one** owning skill. Pin scope, acceptance and blockers.
3. Inspect only relevant code and nearest test. Fix one coherent change. Do not broaden a quality PR into UI work.
4. On the workstation, use `npm run quality:agent:fix`, targeted tests, diff review and exact-HEAD `npm run quality:agent:publish`. With remote-only source, record L0, not L3.
5. Before push run `just pr-guard` on a full checkout, or re-check open PRs/HEAD with the connector. Block stale base/HEAD or overlapping filenames. Use expected SHA, non-default Draft branch and fast-forward only. Never reuse merged branches, merge or manually rerun paid CI.
6. Update only the canonical roadmap item with remaining evidence; put procedures in runbooks and historical state in Git/archive.

## Remote exact-HEAD snapshot fallback

Only if an existing GitHub artifact `source-snapshot-<HEAD_SHA>` has matching workflow HEAD and SHA256: run `just snapshot-check ZIP HEAD_SHA ARTIFACT_SHA256 DESTINATION` to safely extract it. A **snapshot is not a Git checkout**: it has no `.git`, dependencies or strict publication proof. If no verified artifact exists, fetch minimal exact-ref files with the connector. Do not retry blocked DNS/codeload or trigger CI to create an artifact.

Record: `HEAD | changed paths | L0/L1/L2/L3 | NOT_RUN | blocker | next action`. Full fallback procedure and safety contracts: `docs/agent-policy-details.md`.
