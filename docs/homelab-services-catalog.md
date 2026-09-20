# Homelab services catalog migration

The homelab catalog is migrating through a **coordinated direct cutover**. Site
Alban is a presentation consumer; it must not become a second inventory authority
and it must not keep a long-lived v1/v2 compatibility layer.

## Target authority

The future canonical model is owned by `nabla-compose`:

1. service-local Backstage `catalog-info.yaml` descriptors own catalog identity,
   ownership, system membership and standard relations;
2. Docker Compose owns runtime service/image/ports/networks/healthcheck facts;
3. minimal `x-nabla` owns only Nabla-specific operational/security semantics
   that do not have a suitable standard representation;
4. generated CycloneDX/provider views share the same stable identities and
   `catalogRevision`;
5. FastAPI Sample reconciles declared state with runtime/health/provider evidence;
6. Site Alban renders that reconciled contract.

Cartography/Neo4j may enrich observed graph/security analysis but never becomes
the lifecycle or catalog source of truth.

## Migration policy

This service is non-critical, so a short catalog/Architecture interruption is an
acceptable trade-off for a simpler migration.

The cutover rules are therefore:

- no parallel v1/v2 reader;
- no dual write;
- no old-schema runtime fallback;
- no permanent compatibility translation layer;
- no independent hand-maintained service inventory in this repository.

`public/homelab-services.json` must be replaced during the migration rather than
kept indefinitely for v1 compatibility. If a bundled last-known-good artifact is
still useful after cutover, it must be generated from the **new schema**, carry
the same `catalogRevision`, and remain cache/resilience data only.

Rollback is performed by reverting the coordinated repository/deployment commits,
not by maintaining two wire contracts.

## Cutover sequence

```text
nabla-compose
Backstage + Compose + minimal x-nabla
              |
              v
       canonical generator
              |
       +------+------+
       |             |
       v             v
   CycloneDX    declared/provider
                   projections
                      |
                      v
                fastapi-sample
             reconciled read model
                      |
                      v
               nabla-site-alban
```

The coordinated migration should:

1. freeze a known-good pre-cutover commit/tag in all participating repositories;
2. validate the new `nabla-compose` catalog for stable IDs, relation closure,
   exposure/access-policy coverage and one `catalogRevision`;
3. update FastAPI's loader/reconciliation/API contract directly to the new model;
4. update Site Alban's types/loaders/Architecture and TrueNAS presentation directly
   to that contract;
5. remove v1-only parsers, fixtures and compatibility overlays in the same
   migration window;
6. deploy FastAPI then Site Alban and validate the end-to-end read model;
7. rollback the coordinated deployment if acceptance fails rather than reopening
   a dual-schema compatibility path.

## Site Alban acceptance contract

Before production cutover, prove:

- stable canonical entity/service IDs drive React/graph keys;
- every relation endpoint resolves;
- declared and observed state remain visually distinct;
- relation type, strength and evidence are preserved where present;
- exposure/access intent is rendered from canonical declarations, not inferred
  from hostnames or labels;
- missing runtime/security evidence produces unknown/unavailable presentation,
  not a false DOWN state;
- any LKG artifact uses the new schema and matching `catalogRevision`;
- EN/FR Architecture and TrueNAS pages build and render successfully;
- local quality gate and production build pass on the final cutover tree.

## Source design

The authoritative migration design lives in `nabla-compose`:

- `docs/service-catalog-security-graph.md`;
- `docs/service-catalog-v2-normalization.md`.

Site Alban should follow those contracts rather than inventing a consumer-specific
catalog schema.
