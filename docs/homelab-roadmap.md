# Homelab integration roadmap

Last reconciled: 10 September 2026.

This document is the focused backlog for the TrueNAS / FastAPI / `nabla-compose`
integration. `docs/quality-roadmap.md` remains the cross-project quality roadmap;
items discovered during homelab work must not remain only in chat or PR comments.

## P0 — TrueNAS 26 WebSocket API migration

- [ ] Treat the TrueNAS 26 API transition as an **upgrade blocker**. TrueNAS 26
  removes the legacy REST API; no homelab integration may depend on a REST-only
  TrueNAS endpoint before the next appliance upgrade.
- [ ] Inventory every TrueNAS integration across `fastapi-sample`,
  `nabla-compose`, site scripts, CSI/storage automation, MCP tooling and runbooks.
  Classify each call as JSON-RPC 2.0 over WebSocket, REST, CLI/SSH or indirect.
- [ ] Migrate every remaining REST call to the versioned TrueNAS JSON-RPC 2.0
  WebSocket API documented at <https://api.truenas.com/>. Prefer one reusable
  authenticated client with explicit method allowlists, deadlines, reconnect
  behaviour and sanitized errors.
- [ ] Preserve the current health distinction between HTTPS listener reachability
  and authenticated TrueNAS API health (`system.version`, `app.query`, etc.).
- [ ] Add contract tests that fail if a new TrueNAS `/api/v2*` REST endpoint is
  introduced in maintained runtime code.
- [ ] Validate WebSocket authentication/RBAC with the read-only observer account,
  then run a pre-upgrade smoke covering DNS → TCP/TLS → WebSocket → auth →
  `system.version` + `app.query`.
- [ ] Update the architecture UI to expose the observed TrueNAS API transport
  (`websocket-jsonrpc`) so a future REST regression is visible.

Official references:

- <https://api.truenas.com/>
- <https://www.truenas.com/docs/scale/26/gettingstarted/versionnotes/>

## P0 — Canonical homelab catalog generation

Canonical ownership is `nabla-compose` service-local `x-nabla` metadata. FastAPI
is an observer/distributor and Site Alban is a consumer; neither should become a
second hand-maintained inventory.

- [ ] Extend `nabla-compose/scripts/generate-service-topology.py` so one generator
  also emits `catalog/homelab-services.json` as a deterministic compatibility
  projection alongside `catalog/services.json` and
  `catalog/service-topology.json`.
- [ ] Define the projection schema explicitly: stable service ID, name, public and
  internal URLs, external/tunnel intent, environment, monitoring target,
  presentation metadata and runtime binding where safe. Never copy credentials.
- [ ] Extend `--check`, pre-commit and `scripts/agent-quality-gate.sh` so a stale
  `catalog/homelab-services.json` fails before build.
- [ ] Detect missing components, not only broken relations. A tracked Compose
  service intended for the Nabla inventory must either carry service-local
  `x-nabla` metadata or an explicit documented ignore reason. Missing IDs,
  duplicate IDs and unresolved relation targets must fail generation.
- [ ] Add generator tests for add / rename / remove / reconnect operations and
  verify all three generated catalog contracts change together.
- [ ] Add a cross-repository drift check: Site Alban's bundled fallback must match
  the canonical generated projection revision. Prefer a generated artifact or
  repository-dispatch workflow over manual copy/paste.
- [ ] Trigger Site/FastAPI contract validation when `nabla-compose` merges a
  catalog-affecting change. The trigger must not deploy if only generated
  consumer validation is needed.
- [ ] Once the generated projection is stable, stop hand-editing
  `public/homelab-services.json`; either generate it from the canonical artifact
  or replace it with a last-known-good bundled artifact carrying
  `catalogRevision`.

Existing automation already available in `nabla-compose`:

```bash
python scripts/generate-service-topology.py
python scripts/generate-service-topology.py --check
bash scripts/quality-gate.sh
```

The existing `nabla-service-catalog` skill, pre-commit hook and agent quality gate
already invoke/check the topology generator. The missing work is extending this
same path to the compatibility catalog and explicit missing-component policy.

## P0 — FastAPI health contract convergence

- [x] Consume probe-first health without making aggregate reconciliation block the
  first useful TrueNAS/service evidence.
- [x] Keep stale health-board data from overwriting fresher aggregate/probe data.
- [x] Treat `runtime_missing` plus fresh positive origin evidence as inventory
  drift rather than proof that the application is down.
- [x] FastAPI 1.13.15 treats Cloudflare timeout/connection/empty/stale inventory as
  **unconfirmed** evidence rather than global degradation. Site Alban now adds an
  explicit ⚠️ warning when Cloudflare cannot be confirmed while leaving service
  health unchanged.
- [ ] Consume the remaining per-row rolling probe metadata from FastAPI 1.13.15:
  `probe_source`, observation age, stale threshold, estimated interval,
  `next_probe_in_seconds`, refresh error and last-known state/reachability.
- [ ] After `fastapi-sample#236` is merged and its schema is stable, consume its
  local-runtime dependency report and separate **evidence coverage** from
  **healthy coverage**. Do not code against the open PR's schema as if final.
- [ ] Evaluate adaptive UI polling (cached aggregate ~5 s, faster while a server
  refresh is active) separately from provider probe cadence. Browser refresh
  frequency must not increase TrueNAS/pfSense/Cloudflare fan-out.

## P1 — Refactoring / code-size debt

Refactor cohesive responsibilities instead of raising size thresholds. The first
three targets are:

- [ ] Refactor `lib/homelabHealth.ts` into contract types, parsing/validation and
  transport loaders.
- [ ] Refactor `lib/homelabObservability.ts` into deep-diagnostic parsing,
  platform-metric parsing and fallback orchestration.
- [ ] Refactor `app/components/homelab/HomelabOperationalEvidence.tsx` into
  control-plane, deep-diagnostic, exposure, freshness and metrics sections.

Then review and split other maintained homelab files over ~300 lines, including
`lib/homelabOperationalEvidence.ts` and any tests that grow beyond a cohesive
scenario boundary. Do not refactor generated JSON or static data merely to meet a
line-count target.

- [ ] Add a non-regression code-size report to the Site agent quality gate. New or
  modified source/test files above agreed thresholds should warn/fail using the
  same baseline-aware philosophy as `fastapi-sample` rather than imposing a
  repository-wide big-bang refactor.

## Completion rule

Before an agent reports a homelab task complete:

1. run the closest deterministic quality gate and inspect the final CI;
2. list every requested or discovered item that remains incomplete;
3. add each deferred item as an unchecked roadmap entry here (and in
   `docs/quality-roadmap.md` when it is cross-cutting);
4. never leave the only record of unfinished work in chat, a transient scratchpad
   or a TODO comment;
5. record any dependency on an unmerged upstream PR as pending rather than
   claiming it is implemented.
