---
name: homelab-runtime-status
description: >-
  Distinguish catalog declarations, TrueNAS runtime, health probes, and exposure when validating a homelab service.
---
# Runtime evidence — never confuse declarations and observations

Public observer: `https://fastapi-sample.fastapicloud.dev`. Contracts are implemented in FastAPI Sample, not this Site.

| Endpoint | Meaning |
| --- | --- |
| `/api/homelab/status` | Declaration/runtime reconciliation: in_sync, declared_only, observed_only, binding_conflict, runtime_unknown, not_observed |
| `/api/homelab/runtime` | Sanitized TrueNAS Apps runtime; cannot prove standalone Compose workload health |
| `/api/homelab/health` | Functional service and dependency evidence |
| `/api/homelab/declared-services` | Source declarations from Compose |
| `/api/site/catalog/v2`, `/api/site/health/v2` | Site's read models, full `entityRef` + `catalogRevision`; machine credentials never enter browser |
| `/healthz`, `/sickz` | FastAPI dependency / external-exposure checks; exposure is not health |

**Workstation with real authorized LAN:** capture the affected service before and after changing it; compare declarations, binding, health, exposure, resource timestamps and application-level checks. Use bounded `curl` or repository diagnostics, one target at a time. Never output tokens or raw sensitive URLs.

**Remote Codex without LAN:** inspect the catalog contracts, producer PR, consumer mapping and stored sanitized evidence at exact SHA. Do not infer runtime from Git, do not spoof headers, repeatedly probe private IPs, or mark unreachable service `DOWN`. Report `NOT_RUN`/unknown.

`in_sync` proves a supported binding, not a functioning HTTP service. `declared_only` can reflect a migrated standalone Compose workload. `running`, `reachable`, `healthy`, `externally reachable` and `migrated` have different acceptance criteria. Never mark migration complete without functional checks and persistence after restart. Exposure defects go to Compose/FastAPI roadmaps; Site handles rendering only.

For catalog changes load `nabla-service-catalog`. Keep the NPMplus migration gate and TrueNAS platform procedures in the owning `nabla-compose` runbooks, not this frontend consumer skill.
