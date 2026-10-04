# OWASP DSOMM static snapshot

`model.snapshot.json` is a build-time snapshot of the OWASP DevSecOps Maturity
Model data repository.

- upstream: `devsecopsmaturitymodel/DevSecOps-MaturityModel-data`
- source: `generated/model.yaml`
- version: 5.0.2
- upstream release: 2026-09-17
- snapshot date: 2026-10-01
- source commit: `a2c1b7e6c7cc22de0d478027d76fd8d02c41fd7a`
- source and license links: pinned to that exact commit, never `main`
- upstream license: GPL-3.0 (see the upstream `LICENSE`)

The snapshot keeps the fields needed by the Site Alban explorer: stable upstream activity
identity (`uuid`, including DSOMM suffix variants), dimension/subdimension, maturity level, description, risk, measure,
assessment criteria, implementation difficulty, usefulness, tags and framework
mappings. The larger implementation/tool lists are intentionally omitted.

## Runtime contract

The website does not fetch OWASP DSOMM at runtime and does not embed the Angular
application. `lib/dsommSnapshot.ts` validates the bundled artifact at module
load and fails closed on malformed or unpinned provenance, duplicate/invalid activity IDs, unknown/orphan
dimensions, invalid maturity/difficulty scores, empty tags/mappings, inconsistent
dates, or malformed mappings.

The page therefore remains deterministic and available even when GitHub, OWASP or
the future homelab DSOMM service is unavailable.

## Updating the snapshot

Treat an upstream refresh as a supply-chain update, not live content:

1. select an explicit upstream release/commit;
2. inspect `generated/model.yaml` metadata and upstream `LICENSE`;
3. regenerate the normalized JSON without adding runtime fetches;
4. preserve stable upstream activity IDs and the typed fields consumed by
   `lib/dsommSnapshot.ts`;
5. update version, release date, snapshot date and full source commit together;
6. run `unit-tests/dsommPageContract.test.ts` and the repository local-first
   quality/publish gate before merge.

The future DSOMM application in `nabla-compose` may replace the primary data
provider only after it can expose an equivalent versioned read-only contract.
The static snapshot should remain the last-known-good fallback during that
cutover; there must be no second independently maintained DSOMM model.
