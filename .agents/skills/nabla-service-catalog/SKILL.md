---
name: nabla-service-catalog
description: >-
  Keep Site Alban's Backstage V2 cards, icon mapping and graph synchronized with nabla-compose and FastAPI without inventing service state.
---
# Backstage V2 consumer

The producer of truth is `AlbanAndrieu/nabla-compose` (`apps/*/catalog-info.yaml`, `catalog/catalog-info.yaml`, `x-nabla`). FastAPI serves `/api/site/catalog/v2` and `/api/site/health/v2`; Site consumes only sanitized `/api/homelab-catalog-v2`. No local V1 fallback.

- Join by full `entityRef` **and** `catalogRevision`, never by display name. Reject ambiguous nodes and invented edges.
- Keep declared kind/type/lifecycle/criticality separate from observations. Missing, blocked, stale, DENIED or NOT_RUN evidence = unknown, never healthy.
- OWNER may inspect authorized endpoints/metrics; SERVICE cache must not store URLs, IPs, ports, credentials, private health or privileged links.
- Icons are local presentation assets: sync from `nabla-compose/catalog/service-icons.json` via `scripts/sync-homelab-icons.mjs`.
- TrueNAS 26 REST is removed; producers should use versioned JSON-RPC WebSocket or documented transports. Infrastructure changes belong to Compose/FastAPI roadmaps, not this site's backlog.

## Verify according to capability

**Workstation with full checkout:** run `npm run test:catalog:v2`, `just icons-local-check`; if adjacent Compose checkout exists, `just icons-check`. Then test real authorized OWNER/LAN and SERVICE/WAN via `just audit-owner` / `just audit-service`. Producer generator is `python scripts/generate-catalog-v2-artifacts.py --check` **in nabla-compose**, not Site Alban.

**Remote connector-only:** inspect exact-SHA projection, redaction, i18n, icon and graph contracts; do not attempt LAN or claim Playwright/build/L3. Record `NOT_RUN`. Do not create a duplicate catalog or cache source.

Track unfinished consumer work only in `docs/homelab-roadmap.md`; link from general roadmap instead of copying checklists. A merged producer PR is not deployed runtime evidence.
