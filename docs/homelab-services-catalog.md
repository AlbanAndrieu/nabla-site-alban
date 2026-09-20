# Homelab services catalog migration

The canonical homelab inventory is owned by `nabla-compose` service-local
`x-nabla` metadata. FastAPI distributes/reconciles that declaration with
runtime and health evidence; Site Alban is a consumer and keeps a generated
last-known-good fallback for resilience.

## Canonical source and generated contracts

`nabla-compose` now generates two compatibility contracts plus one
interoperability contract:

- `catalog/services.json` — v1 service list;
- `catalog/service-topology.json` — v1 topology;
- `catalog/service-catalog-v2.json` — canonical interoperable projection;
- `catalog/backstage/catalog-info.yaml` — Backstage projection;
- `catalog/cyclonedx/homelab.cdx.json` — CycloneDX 1.7 service BOM.

The source of authority remains Compose + `x-nabla`. Generated files are not
edited independently.

```bash
python scripts/generate-service-topology.py
python scripts/generate-service-catalog-v2.py

python scripts/generate-service-topology.py --check
python scripts/generate-service-catalog-v2.py --check
```

## Site Alban transition

Site Alban bundles `public/service-catalog-v2.json` as a last-known-good
declared-state artifact.

`lib/serviceCatalogV2.ts`:

- validates the v2 root/entity/relation contract;
- preserves stable Nabla references;
- exposes the local v2 catalog;
- adapts v2 to the existing `ServiceTopology` view model.

This gives the migration path:

```text
nabla-compose x-nabla
        │
        ▼
service-catalog-v2.json
        │
        ├──────────────► Backstage
        ├──────────────► CycloneDX / Dependency-Track
        └──────────────► Site Alban LKG
                              │
                              ▼
                    v2 -> topology adapter
                              │
                              ▼
                    existing React Flow UI
```

The adapter is intentionally temporary. It allows the topology UI to switch
source contracts before every component is rewritten.

## Service-card compatibility

`public/homelab-services.json` still contains presentation data that is not yet
fully modeled upstream, including explicit browser navigation choices and local
icon assets.

During migration, `lib/homelabServices.ts` overlays matched services with v2
canonical metadata:

- stable ID;
- name;
- kind/subtype;
- category/domain;
- presentation role;
- criticality;
- upstream description/icon when present;
- `catalogRevision` and `topologyVersion`.

The existing site-owned navigation values remain higher priority. This prevents
the security/service inventory from becoming coupled to UI-specific routing.

## Runtime API transition

FastAPI v1 remains the runtime primary path for now:

- `/api/homelab-services`;
- `/api/homelab-topology`.

The next step is a versioned v2 endpoint carrying the exact upstream
`catalogRevision`. Site Alban should only prefer that endpoint after contract
tests prove revision parity and fallback behaviour.

Do not create a FastAPI -> Site -> FastAPI dependency loop. The bundled v2 file
must remain usable without the runtime observer.

## Security graph boundary

Cartography/Neo4j is an observed/enrichment graph, not the catalog authority.
Observed GitHub, Kubernetes, Cloudflare, Trivy, IAM or vulnerability relations
must join stable Nabla references while retaining provenance. They must not
rewrite declared `x-nabla` dependencies or lifecycle ordering.

OSCAL control/evidence mappings are also downstream views. A NIST CSF
`securityFunctions` tag is classification metadata and does not demonstrate
control implementation or compliance.

## Retirement conditions for v1 fallbacks

Retire `public/service-topology.json` and hand-maintained service-card inventory
only after all of the following are accepted:

1. FastAPI serves the v2 contract with revision parity.
2. Site API/fallback paths prefer v2 and survive FastAPI unavailability.
3. Cross-repository drift is rejected automatically.
4. React Flow/service cards render equivalent or better information from v2.
5. Site-only presentation overrides are separated from canonical inventory data.
