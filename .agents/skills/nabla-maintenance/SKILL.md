---
name: nabla-maintenance
description: >-
  Continue Site Alban roadmap or PR with bounded context, targeted proof and minimal GitHub Actions usage.
---
# Site Alban maintenance — one batch at a time

1. Detect execution mode in `AGENTS.md`. With a checkout: `just context && just preflight`; with connector-only access: inspect current PR HEAD and exact-SHA files.
2. Read the relevant item in `docs/quality-roadmap.md` or `docs/homelab-roadmap.md` and **one** owning skill. Pin scope, acceptance and blockers.
3. Inspect only relevant code and nearest test. Fix one coherent change. Do not broaden a quality PR into UI work.
4. On the workstation, use `npm run quality:agent:fix`, targeted tests, diff review and exact-HEAD `npm run quality:agent:publish`. With remote-only source, record L0, not L3.
5. Re-read current PR HEAD before API writes; use a non-default Draft branch and expected SHA. Never merge or manually rerun paid CI.
6. Update only the canonical roadmap item with remaining evidence; put procedures in runbooks and historical state in Git/archive.

## Remote exact-HEAD snapshot fallback

Only if an existing GitHub artifact `source-snapshot-<HEAD_SHA>` has matching workflow HEAD and SHA256: run `just snapshot-check ZIP HEAD_SHA ARTIFACT_SHA256 DESTINATION` to safely extract it. A **snapshot is not a Git checkout**: it has no `.git`, dependencies or strict publication proof. If no verified artifact exists, fetch minimal exact-ref files with the connector. Do not retry blocked DNS/codeload or trigger CI to create an artifact.

Record: `HEAD | changed paths | L0/L1/L2/L3 | NOT_RUN | blocker | next action`. Full fallback procedure and safety contracts: `docs/agent-policy-details.md`.
