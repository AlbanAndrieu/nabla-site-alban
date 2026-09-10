# Homelab services catalog migration

The canonical homelab inventory is owned by `nabla-compose` service-local
`x-nabla` metadata. `fastapi-sample` distributes and reconciles that declaration
with runtime/health evidence; Site Alban is a consumer and keeps a bundled
fallback for resilience.

## Canonical source and generated contracts

`nabla-compose` already generates:

- `catalog/services.json`;
- `catalog/service-topology.json`.

The generator and its deterministic check are:

```bash
python scripts/generate-service-topology.py
python scripts/generate-service-topology.py --check
```

They are also covered by the `nabla-service-catalog` skill, pre-commit and the
agent quality gate. Generated catalog files must not become independent sources
of truth.

The next compatibility step is tracked in `docs/homelab-roadmap.md`: extend the
same generator to emit `catalog/homelab-services.json`, detect catalog-worthy
Compose services missing `x-nabla`, and propagate a `catalogRevision` so
cross-repository consumers can detect drift.

## Transition architecture

The website currently keeps `public/homelab-services.json` as an independent
fallback while trying FastAPI first.

Primary source:

- `https://fastapi-sample.fastapicloud.dev/api/homelab-services`;
- override with the server-side `HOMELAB_SERVICES_API_URL` environment variable
  when needed.

Fallback source:

- repository file `public/homelab-services.json`.

The primary request has a short timeout and the returned payload is validated
before use. HTTP errors, timeouts, invalid JSON, an empty service list, or
malformed entries cause an immediate fallback to the repository catalog.

The fallback is temporary resilience data. Do not add a new service by editing
it alone. Add or change the canonical `x-nabla` declaration in `nabla-compose`,
regenerate the catalog contracts and then synchronize the consumer artifact.

## Website integration

- `lib/homelabServices.ts` owns source selection, timeout, validation and
  fallback;
- the App Router TrueNAS grid uses that loader directly on the server;
- `GET /api/homelab-services` exposes the selected catalog to browser consumers
  without requiring cross-origin CORS access to FastAPI;
- response header `X-Homelab-Services-Source` is `fastapi` or `local-fallback`,
  making the active source observable.

`/homelab-services.json` intentionally remains a real static file during the
migration. It must not create a FastAPI → website → FastAPI dependency loop.

## Target architecture

```text
nabla-compose apps/**/compose.yml + x-nabla
                  │
                  ▼
       generate-service-topology.py
          │          │           │
          ▼          ▼           ▼
 services.json  topology.json  homelab-services.json
          │          │           │
          └──────────┴─────┬─────┘
                           ▼
                    fastapi-sample
                  runtime reconciliation
                           │
                    versioned API contract
                           │
                           ▼
                    nabla-site-alban
                  + generated LKG fallback
```

Before deleting the local fallback, prove the generated compatibility artifact,
cross-repository drift check and a last-known-good resilience path in CI and
Preview/production.
