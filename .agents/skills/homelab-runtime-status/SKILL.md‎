---
name: homelab-runtime-status
description: Inspect Nabla homelab runtime, health, exposure and declaration state before and after infrastructure or application changes.
---

# Homelab runtime status

Use this skill whenever a task asks whether a homelab service is running, healthy, exposed, migrated, reachable, synchronized with the catalog, or safe to cut over.

The primary public observer is FastAPI Sample:

```text
https://fastapi-sample.fastapicloud.dev
```

Do not reduce all status questions to one endpoint. The API intentionally separates declarations, runtime observation, functional health and external exposure.

## Endpoint map

### `/api/homelab/status`

Use first for migration/reconciliation work.

It joins the code-owned `nabla-compose` declarations with the observed TrueNAS application runtime and classifies services with states such as:

- `in_sync`;
- `declared_only`;
- `observed_only`;
- `binding_conflict`;
- `runtime_unknown`;
- `not_observed`.

Interpretation rules:

- `in_sync` means the declared TrueNAS binding matched an observed TrueNAS App; it does **not** prove the application works at HTTP/application level.
- `declared_only` may indicate a stopped/removed native app, a bad runtime binding, or a successfully migrated standalone Docker Compose workload that the current TrueNAS-only runtime observer cannot yet see.
- `observed_only` is especially important during migration inventory: a native TrueNAS App exists without a corresponding repository declaration.
- `runtime_unknown` means runtime evidence could not be obtained and must never be treated as healthy.

### `/api/homelab/runtime`

Use for the raw sanitized TrueNAS application snapshot.

It currently observes TrueNAS Apps through the TrueNAS client and exposes application/container facts such as state, version, upgrade availability and active workload containers.

Current limitation: this endpoint does **not** prove visibility of standalone Docker Compose services after they leave the TrueNAS Apps subsystem.

### `/api/homelab/health`

Use for functional service/platform health evidence.

Prefer this endpoint when deciding whether a service is actually usable after a migration. A running container is insufficient if the service returns errors, cannot reach its database, or fails an application-specific endpoint.

### `/api/homelab/declared-services`

Use to inspect the service inventory generated from `nabla-compose` `x-nabla` metadata.

If a service is missing here, fix the repository/catalog declaration before trying to fix dashboards or monitoring consumers.

### `/api/homelab-topology`

Use to inspect declared dependencies and verify that a migration has not silently broken architecture relations such as database, proxy, observability or authentication dependencies.

### `/api/homelab-services`

Use for FastAPI-owned presentation/exposure metadata. This is useful for UI/external exposure reasoning but is not the authoritative runtime state.

### `/healthz`

Use for deep FastAPI Sample and dependency checks. Do not assume `/healthz` alone proves every homelab service is healthy.

### `/sickz`

Use only for external-exposure/security-policy reasoning.

A target being `reachable` from FastAPI Cloud means it responded from an external PaaS context. It is **not** a generic service-health success condition and may actually represent an exposure defect when the service is declared internal.

## Recommended inspection sequence

Before a migration or risky infrastructure change:

```bash
BASE_URL="${HOMELAB_STATUS_BASE_URL:-https://fastapi-sample.fastapicloud.dev}"

curl -fsS "$BASE_URL/api/homelab/status" | jq .
curl -fsS "$BASE_URL/api/homelab/runtime" | jq .
curl -fsS "$BASE_URL/api/homelab/health" | jq .
curl -fsS "$BASE_URL/api/homelab/declared-services" | jq .
curl -fsS "$BASE_URL/api/homelab-topology" | jq .
curl -fsS "$BASE_URL/sickz" | jq .
```

Capture the relevant rows for the service being changed.

After the change, run the same queries and compare:

- runtime binding/state;
- functional health;
- dependency health;
- external exposure;
- catalog/topology identity;
- version and container identity where available.

Do not report a migration as successful until design-time and functional runtime evidence agree, or until an explicitly documented observer limitation explains the discrepancy.

## TrueNAS native -> Docker Compose migrations

For a native TrueNAS App being replaced by repository-managed Compose:

1. find the native app in `/api/homelab/runtime` and `/api/homelab/status`;
2. record app/version/container facts before shutdown;
3. validate the new Compose and `x-nabla` declaration;
4. snapshot/copy persistent data according to the migration roadmap;
5. stop the native app;
6. start Compose;
7. run direct application-specific health tests;
8. inspect `/api/homelab/health`;
9. inspect `/sickz` only if exposure is relevant;
10. explain any `declared_only` result caused by the current lack of a generic Docker Compose runtime provider.

Never reclassify `declared_only` as `in_sync` by changing metadata to lie about the runtime. Fix or extend the observer instead.

## NPMplus hard gate

Before migrating the native Nginx Proxy Manager into `apps/npmplus`, prove NPMplus works independently.

Repository configuration currently expects:

- UI: `30360`;
- HTTP: `30361`;
- HTTPS: `30362`;
- data: `/mnt/cpool/npmplus`.

When executing from the LAN/TrueNAS host, test at least:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://172.17.0.24:30360/
curl -fsS -o /dev/null -w '%{http_code}\n' http://172.17.0.24:30361/
curl -kfsS -o /dev/null -w '%{http_code}\n' https://172.17.0.24:30362/
```

Then perform functional tests that cannot be replaced by TCP checks:

1. admin UI login;
2. create a temporary proxy host to a disposable upstream;
3. verify HTTP routing;
4. verify HTTPS routing/certificate handling;
5. restart NPMplus;
6. verify configuration and certificate persistence;
7. verify Gatus/AutoKuma/runtime evidence after restart.

If NPMplus fails any of these checks, do not stop or migrate the native Nginx Proxy Manager.

## Evidence hierarchy

Prefer evidence in this order:

1. direct application-level health/API request;
2. `/api/homelab/health` functional evidence;
3. runtime/container state from `/api/homelab/runtime`;
4. Gatus/AutoKuma checks;
5. `/api/homelab/status` reconciliation;
6. raw TCP reachability;
7. dashboard color/state.

A dashboard must never override stronger runtime evidence.

## Failure semantics

Use precise language:

- **running**: container/process state indicates execution;
- **reachable**: network connection succeeds;
- **healthy**: expected application-level health behavior succeeds;
- **externally reachable**: FastAPI Cloud or another external probe can reach it;
- **in sync**: declaration and supported runtime observer agree;
- **migrated**: persistent data, configuration, runtime health, restart persistence and rollback criteria all passed.

## Catalog synchronization

After changing a Compose service or `x-nabla` metadata, also use the `nabla-service-catalog` skill.

Run the repository generators/checks and verify Homarr, Gatus and AutoKuma remain derived consumers rather than independent sources of truth.

## Security rules

- Never print or commit secret values returned by runtime/configuration systems.
- Redact API keys, passwords, OAuth client secrets and database credentials in notes/logs.
- Never expose Docker socket or docker-socket-proxy publicly to make runtime inspection easier.
- Do not use `/sickz` to justify exposing an internal service.
- When runtime evidence is stale/unreachable, report uncertainty instead of guessing.

## Current API source

The endpoint contracts are registered in the `fastapi-sample` repository under `nabla/api/health_routes.py`; TrueNAS reconciliation is implemented in `nabla/api/homelab_runtime.py`.

Re-check these files if FastAPI Sample changes its homelab API before relying on old endpoint semantics.
