# OWASP DSOMM static snapshot

`model.snapshot.json` is a build-time snapshot of the OWASP DevSecOps Maturity
Model data repository.

- upstream: `devsecopsmaturitymodel/DevSecOps-MaturityModel-data`
- source: `generated/model.yaml`
- version: 5.0.2
- upstream release: 2026-09-17
- snapshot date: 2026-10-01
- source commit: `a2c1b7e6c7cc22de0d478027d76fd8d02c41fd7a`
- upstream license: GPL-3.0 (see the upstream `LICENSE`)

The snapshot keeps the fields needed by the Site Alban explorer: stable activity
UUID, dimension/subdimension, maturity level, description, risk, measure,
assessment criteria, implementation difficulty, usefulness, tags and framework
mappings. The larger implementation/tool lists are intentionally omitted.

The website does not fetch OWASP DSOMM at runtime and does not embed the Angular
application. The future DSOMM service planned in `nabla-compose` should replace
the snapshot as the data provider while preserving the typed consumer contract in
`lib/dsommSnapshot.ts`.
