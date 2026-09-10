---
name: nabla-service-catalog
description: Keep Site Alban synchronized with the canonical nabla-compose homelab service inventory and generated topology contracts.
---

# Nabla service catalog consumer synchronization

Use this skill whenever a homelab service is added, renamed, removed, moved,
re-exposed, given a new runtime binding, or materially changes dependencies,
monitoring or presentation metadata.

## Canonical ownership

The source of truth is the service-local `x-nabla` metadata in
`AlbanAndrieu/nabla-compose`. Site Alban and FastAPI are consumers. Do not fix a
catalog mismatch by inventing a second service definition in this repository.

The canonical producer currently runs:

```bash
python scripts/generate-service-topology.py
python scripts/generate-service-topology.py --check
bash scripts/quality-gate.sh
```

It generates `catalog/services.json` and `catalog/service-topology.json` and is
already enforced by the `nabla-compose` pre-commit and agent quality gate.

## Trigger rule

When any tracked Compose service or `x-nabla` block is added or materially
modified:

1. inspect the service-local `x-nabla` declaration;
2. ensure its stable ID, kind/category, runtime binding, monitoring metadata and
   evidenced dependency relations remain correct;
3. regenerate the canonical catalog contracts;
4. run the generator in `--check` mode;
5. verify every relation source/target resolves and no duplicate ID was created;
6. verify the Site fallback and FastAPI contracts do not drift from the generated
   revision;
7. run the repository-specific quality gate before publication.

A catalog-worthy Compose service without `x-nabla` must not disappear silently.
The canonical generator should eventually require either `x-nabla` or an
explicit documented ignore reason. This missing-component enforcement and the
third generated compatibility catalog are tracked in `docs/homelab-roadmap.md`.

## `catalog/homelab-services.json`

The target is to extend the existing `nabla-compose` generator so it also emits
`catalog/homelab-services.json` from the same canonical metadata. Do not create a
second hand-maintained generator or a manually edited compatibility catalog.

Until that output exists:

- treat `public/homelab-services.json` as a resilience fallback, not an authoring
  source;
- compare service IDs/topology against the canonical generated contracts after a
  service change;
- record any manual synchronization still required as unfinished roadmap work.

After the output exists, require its `--check` validation in pre-commit/CI and
prefer `catalogRevision`-based drift detection between repositories.

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

1. add an unchecked item to `docs/homelab-roadmap.md`;
2. also add it to `docs/quality-roadmap.md` when it is cross-cutting;
3. identify the dependency/blocker in the roadmap item;
4. never leave the only record in chat, a scratchpad or a transient PR comment;
5. do not mark an upstream/unmerged capability as implemented.

A task is complete only when the canonical catalog, generated contracts,
consumer behavior, relevant tests and final CI agree, or the remaining mismatch
is explicitly tracked in the roadmap.
