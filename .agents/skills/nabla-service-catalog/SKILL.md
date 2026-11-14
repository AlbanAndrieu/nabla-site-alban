---
name: nabla-service-catalog
description: >-
  Keep Site Alban synchronized with the canonical nabla-compose homelab service
  inventory and generated topology contracts.
---
# Nabla service catalog consumer synchronization

Use this skill whenever a homelab service is added, renamed, removed, moved,
re-exposed, given a new runtime binding, or materially changes dependencies,
monitoring or presentation metadata.

## Canonical ownership

The source of truth is the Backstage catalog of `AlbanAndrieu/nabla-compose`:
`apps/<app>/catalog-info.yaml`, `catalog/catalog-info.yaml` and the Compose
`x-nabla` route intent. Site Alban and FastAPI are consumers. Do not fix a
catalog mismatch by inventing a second service definition in this repository.

The canonical producer runs:

```bash
python scripts/generate-catalog-v2-artifacts.py
python scripts/generate-catalog-v2-artifacts.py --check
```

It generates `catalog/generated/{entities,homelab.cdx,identity-map}.json`, all
sharing one `catalogRevision`, and is enforced by the `nabla-compose` pre-commit
and agent quality gate.

## Consumption rule

- The Site reads only the sanitized v2 projection served by FastAPI
  (`/api/site/catalog/v2`, `/api/site/health/v2`) and keys nodes by full entity
  ref. There is no local catalog fallback.
- Icons are presentation only: `nabla-compose/catalog/service-icons.json`,
  synchronized by `scripts/sync-homelab-icons.mjs`.
- Detect drift between repositories with `catalogRevision`, never with display
  names.

## Trigger rule

When a homelab service is added, renamed or materially modified in
`nabla-compose`:

1. regenerate and `--check` the v2 artifacts there;
2. verify FastAPI serves the same `catalogRevision`;
3. verify the Site catalog and health views render the entity by its full ref;
4. run the repository-specific quality gate before publication.

## TrueNAS API rule

Do not introduce new TrueNAS REST dependencies. TrueNAS 26 removes the legacy
REST API; maintained integrations must use the versioned JSON-RPC 2.0 WebSocket
API (or an explicitly documented indirect transport) before the next TrueNAS
upgrade. Any REST-only dependency discovered during catalog/runtime work is a P0
upgrade blocker and must be added to `docs/homelab-roadmap.md`.

## Health semantics

Catalog identity is not service health. Keep these proofs distinct:

1. canonical declaration/topology;
2. TrueNAS runtime observation;
3. direct HTTP/HTTPS or TCP/application evidence;
4. pfSense/network evidence;
5. Cloudflare control-plane/exposure evidence;
6. Prometheus telemetry.

An unavailable Cloudflare observer is **unconfirmed evidence**, not proof that a
service is down. Preserve an explicit warning and last-known context without
making the service failed/degraded solely because Cloudflare timed out or could
not be queried.

## Completion rule — mandatory

Before reporting a service/catalog task complete, account for every requested or
discovered item. If anything remains unfinished because of time, an upstream PR,
missing credentials, unavailable infrastructure or deferred refactoring:

1. add one detailed unchecked item to `docs/homelab-roadmap.md`;
2. when the topic is cross-cutting, add only a compact parent/reference in `docs/quality-roadmap.md` instead of duplicating the checklist;
3. identify the dependency/blocker in the roadmap item;
4. never leave the only record in chat, a scratchpad or a transient PR comment;
5. do not mark an upstream/unmerged capability as implemented.

A task is complete only when the canonical catalog, generated contracts,
consumer behavior, relevant tests and final CI agree, or the remaining mismatch
is explicitly tracked in the roadmap.
