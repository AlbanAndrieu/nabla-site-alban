# Homelab catalog v2 consumer contract

Status: **consumer parser implemented, production cutover pending**.

Site Alban is a presentation consumer. It must not become a second inventory
authority and must not maintain a long-lived v1/v2 compatibility layer.

## Authority chain

The canonical model is owned upstream:

1. Backstage `catalog-info.yaml` owns catalog identity, ownership, system
   membership and standard relations;
2. Docker Compose owns runtime image/ports/networks/healthcheck facts;
3. minimal `x-nabla` owns only Nabla-specific operational/security semantics;
4. generated views share stable identities and one `catalogRevision`;
5. FastAPI reconciles declared state with runtime/health/provider evidence;
6. Site Alban renders that reconciled read model.

Cartography/Neo4j may enrich graph/security analysis but is not a lifecycle or
catalog source of truth.

## Site v2 schema

`lib/homelabCatalogV2.ts` already validates the isolated v2 shape:

```json
{
  "schemaVersion": 2,
  "model": "backstage",
  "catalogRevision": "sha256:<64 lowercase hex>",
  "entities": []
}
```

The parser requires unique `entityRef` values and accepts Backstage
`API`, `Component`, `Domain`, `Group`, `Resource` and `System`
entities.

For service presentation, `CatalogV2ServiceView` derives:

- identity from `entityRef` and `metadata.name`;
- display name/description from metadata;
- technical type/lifecycle from `spec`;
- category and NIST CSF functions from tags;
- operational/business criticality from qualified labels;
- provenance from `sourcePath`.

The parser is intentionally **not wired to production loaders yet**. Current
production catalog/topology readers remain v1 until FastAPI publishes the
coordinated v2 read model.

## Direct-cutover policy

The site is non-critical, so a short controlled catalog/Architecture interruption
is preferable to permanent compatibility complexity.

During cutover:

- no parallel v1/v2 reader;
- no dual write;
- no old-schema runtime fallback;
- no permanent translation layer;
- no independently maintained service inventory in this repository.

If a last-known-good artifact remains useful after cutover, it must be generated
from v2, carry the matching `catalogRevision`, and act only as cache/resilience
data. Rollback is performed by reverting the coordinated deployment commits, not
by reopening a second wire contract.

## Acceptance contract

Before production cutover, prove that:

- stable canonical IDs drive React/graph keys;
- every relation endpoint resolves;
- declared and observed state remain distinct;
- relation type, strength and evidence survive reconciliation;
- exposure/access intent comes from canonical declarations, not hostname guesses;
- missing runtime/security evidence renders unknown/unavailable, not false DOWN;
- any LKG artifact uses v2 and the matching `catalogRevision`;
- EN/FR Architecture and TrueNAS surfaces build/render correctly;
- the local quality gate and production build pass on the final cutover tree.

The authoritative upstream design remains in `nabla-compose`:

- `docs/service-catalog-security-graph.md`;
- `docs/service-catalog-v2-normalization.md`.

The remaining cutover sequence and rollback work is tracked only in
`docs/homelab-roadmap.md`.
