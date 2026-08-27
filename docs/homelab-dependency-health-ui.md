# Homelab dependency-aware health UI

## Goal

Use the same dependency-aware health contract across the service cards, TrueNAS topology and every React Flow diagram. The UI must distinguish a service's own runtime/HTTP state from the state inherited from required dependencies.

## Upstream API contract

Consume the next `fastapi-sample` health contract with these distinct fields:

- `local_state`: direct evidence for the service itself;
- `dependency_state`: aggregate state of required topology targets;
- `effective_state`: final state after propagation;
- `required_dependencies`: stable service IDs;
- `blocked_by`: unhealthy/unknown required targets;
- `dependency_evidence`: relation type, target state and evidence source;
- observation age/stale metadata.

Do not infer dependency failures in the browser when FastAPI already provides authoritative propagated evidence.

## Visual semantics

### Service cards

- Main status color uses `effective_state`.
- Show a small runtime badge/indicator for `local_state` so `RUNNING but degraded` remains visible.
- When `blocked_by` is non-empty, render a concise `Blocked by PostgreSQL · ClickHouse` or equivalent explanation.
- Keep evidence source and observation age accessible in details/tooltips.
- A stale snapshot can never look equivalent to a current green snapshot.

### React Flow nodes

Apply the same node-state mapping in **all** homelab/architecture React Flow views rather than maintaining diagram-specific color logic:

- `ok`: healthy effective service state;
- `warn`: degraded, stale or dependency-uncertain;
- `fail`: direct functional failure;
- `unknown`: insufficient authoritative evidence.

A node should support a secondary local/runtime indicator so a `RUNNING` app whose required database is down does not appear fully green.

### React Flow edges

Required dependency edges are health-bearing:

- healthy target: normal required edge;
- degraded/unknown target: warning edge;
- failed target: failed required edge;
- optional edge: visually secondary and never downgrades a node by itself.

Expose/publish edges use a separate visual vocabulary from dependency edges:

- `HAProxy direct`;
- `Cloudflare Tunnel`;
- `LAN/VPN only`;
- internal service-to-service routing.

Keep meaningful infrastructure ports visible where they explain architecture:

- TrueNAS HTTPS/API: `7000/tcp` via pfSense HAProxy;
- pfSense administration: `10443/tcp`, LAN/VPN only;
- TrueNAS SSH: `9922/tcp`, LAN only.

Cloudflare health must not be presented as evidence for the direct TrueNAS `:7000` path.

## Shared implementation target

Extract shared helpers rather than duplicating status logic per diagram:

- `resolveEffectiveServiceState()`
- `serviceStateClass()` / design-token mapping
- `dependencyEdgeState()`
- `exposureEdgeKind()`
- shared React Flow node and edge data types
- shared tooltip/evidence component

The `/architecture` graph, `/truenas#homelab` graph and service-grid links should consume the same resolver.

## Acceptance cases

1. Langfuse App `RUNNING`, PostgreSQL `STOPPED`, ClickHouse `STOPPED` -> Langfuse is degraded/warn and names both blockers.
2. Open WebUI `RUNNING`, LiteLLM degraded -> Open WebUI reflects the required dependency degradation.
3. Optional observability dependency down -> service state remains unchanged but edge/details show the optional failure.
4. TrueNAS public edge shows `Internet -> pfSense:7000 -> HAProxy -> TrueNAS`, not Cloudflare.
5. pfSense `10443` displays as LAN/VPN-only and external reachability is a security violation, not success.
6. Stale FastAPI evidence is visually distinct from live green.
7. Mobile and dark/light themes preserve readable node/edge contrast.
8. All React Flow diagrams share one state mapping and one dependency-edge policy.

## Delivery order

1. Land the FastAPI dependency-propagation API contract.
2. Extend the Next server proxy/types without breaking the current schema.
3. Introduce shared state/edge resolvers and tests.
4. Migrate service cards.
5. Migrate `/truenas#homelab` React Flow.
6. Migrate `/architecture` and any remaining React Flow consumers.
7. Add Playwright/visual regression coverage for healthy, degraded, failed, stale and unknown states.
