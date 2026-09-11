# Homelab integration roadmap

Last reconciled: 11 September 2026.

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
- [x] Consume the remaining per-row rolling probe metadata from FastAPI 1.13.15:
  `probe_source`, observation age, stale threshold, estimated interval,
  `next_probe_in_seconds`, refresh error and last-known state/reachability.
  Retained stale rows preserve the upstream `reachable: null` meaning instead of
  being silently discarded by the older boolean-only parser.
- [x] Consume the stable rolling-evidence semantics delivered with
  `fastapi-sample#236` and separate **evidence coverage** from **healthy
  coverage**. Healthy coverage is derived from retained `origin`/`memory` rows
  that are currently non-stale and healthy; it is not derived from
  `probe_summary.states`, which describes only the current sampled wave.
- [ ] If FastAPI exposes the six-dependency operator diagnostic as a stable API
  contract, consume its normalized `configured / reachable / authenticated /
  application_result / stale / error_stage / error_kind / evidence_complete`
  fields. `fastapi-sample#236` currently provides this report as an operator CLI
  assembled from existing health-board data, so Site Alban must not scrape CLI
  output or invent a second wire contract.
- [ ] Evaluate adaptive UI polling (cached aggregate ~5 s, faster while a server
  refresh is active) separately from provider probe cadence. Browser refresh
  frequency must not increase TrueNAS/pfSense/Cloudflare fan-out.

## P0 — Post-merge Quality remediation

- [ ] Operationally validate the merged
  `.github/workflows/post-merge-quality-remediation.yml`: after an actual failed
  or timed out `CI (Quality and Security)` push on `master`, a converged
  deterministic formatter/pre-commit repair must open a non-default remediation
  PR and dispatch canonical CI on it; a non-auto-fixable failure must instead open
  one deduplicated diagnostic issue with the failed jobs and source run. Also
  validate the fallback issue path when GitHub refuses PR creation or CI dispatch
  with `GITHUB_TOKEN`. Keep this as a recovery safety net, never as permission for
  agents to skip their pre-publish gate.
- [ ] Finish validating the local-first pipeline on a real agent workspace. The CI
  half is now proven repeatedly in #177: formatter-only changes emit
  `QG_AUTOFIX_REQUIRED` with the exact patch and stop before Semgrep/npm/build,
  then a clean retry proceeds through the full gate. Copilot cold bootstrap also
  succeeds with npm 11.17 pinned before Node-backed pre-commit hook installation.
  Ruff now has a single lint authority, `ruff-check --fix --unsafe-fixes`, before
  `ruff-format`, so fixable Python diagnostics no longer stop before their own
  auto-fix hook; a contract prevents the old duplicate `ruff` hook from returning.
  The remaining operational proof is one real local `quality:agent:fix` → commit →
  strict pre-push publication cycle showing that the canonical publication gate
  executes once and leaves a clean tree.
- [x] Remove the duplicate Stylelint authority after proving rule parity. npm /
  `package-lock.json` + Stylelint 17 is now the single CSS lint authority across
  maintained `app/**/*.css`, `components/**/*.css` and `public/*.css`. The parity
  expansion exposed and fixed the CSS Modules `:global()` false positives plus
  two genuine duplicate selectors before the old pre-commit Stylelint 14
  environment and `stylelint-config-standard-scss@3.0.0` were removed. Contract
  tests prevent reintroducing that second toolchain.

## P1 — Refactoring / code-size debt

Refactor cohesive responsibilities instead of raising size thresholds.

- [x] Refactor `lib/homelabHealth.ts` into contract types, parsing/validation and
  transport loaders. The public module is now a thin compatibility facade over
  dedicated types, validation, rolling-probe parsing, pfSense parsing, aggregate
  parsing and HTTP transport modules; the temporary 933-line
  `lib/homelabHealthBase.ts` has been removed. The destructive-diff guard keeps a
  path-scoped reviewed exception for this split rather than enabling the global
  large-deletion bypass, and CI #957 validated canonical formatting, Semgrep,
  code-size reporting, ESLint, Stylelint, Next type generation, TypeScript,
  unit/contract tests and the production build.
- [x] Refactor `lib/homelabObservability.ts` into deep-diagnostic parsing,
  platform-metric parsing and fallback orchestration. The former monolith is now a
  thin composition facade over dedicated types/shared parsing, deep-diagnostic,
  platform-metric, control-plane/edge and fallback modules. The facade lost 534
  lines while every extracted module remains below the 300-line warning threshold.
  A contract test prevents the cohesive parsers from drifting back into the facade;
  the destructive-diff exception remains path-scoped, and CI #961 plus Copilot
  Setup #110 validate the final formatter-clean split, SAST, TypeScript,
  unit/contracts and production build.
- [x] Refactor `app/components/homelab/HomelabOperationalEvidence.tsx` into
  control-plane, deep-diagnostic, exposure, freshness and metrics sections. #178
  keeps one polling owner in the facade (one `/api/homelab-observability` fetch,
  one timer and one `AbortController`) while child sections remain presentation
  owners only; source contracts prevent polling ownership from drifting downward.
- [x] Refactor `lib/homelabOperationalEvidence.ts` without changing its public
  evidence contract. #179 keeps the public compatibility/composition surface and
  extracts generic parsing, pfSense DNS/security/ingress parsing, trusted-source
  TCP exposure parsing, stale-service/dependency-cycle parsing and troubleshooting
  focus into cohesive modules. The split remains below the destructive-diff guard
  naturally, requires no global or new path-scoped bypass, and a source contract
  prevents heavy parser responsibilities from drifting back into the facade.

Next maintained P1 targets should preserve cohesive scenario boundaries rather
than merely moving lines:

- [ ] Split `unit-tests/homelabObservability.test.ts`, separating the large
  aggregate-evidence fixture/scenario from compatibility fallback, route contract
  and UI ownership tests without duplicating fixtures.
- [ ] Split `unit-tests/serviceTopology.test.ts` by catalog/topology contract
  scenario while keeping shared fixtures centralized.
- [ ] Extract cohesive responsibilities from `scripts/agent-quality-gate.sh`
  without creating a second formatter/linter authority or weakening early-fail
  behavior.
- [ ] Continue reducing `HierarchicalArchitectureExplorer.tsx` only when a
  substantive functional change provides a natural extraction boundary; do not
  churn the React Flow surface only to satisfy a line-count target.

- [x] Add a non-regression code-size report to the Site agent quality gate. The
  diff-scoped `scripts/check_code_size.py` now warns above 300 lines, fails new or
  newly oversized maintained source/test files above 600 lines, and grandfathers
  files already above 600 only within a +2% baseline growth margin. Generated,
  public and dependency trees are excluded. The agent gate runs it before npm
  lint/tests and exposes only `WARNING` lines plus the compact summary on success;
  the validated #177 run reported 8 inspected files, 1 warning and 0 errors.
  Contract tests cover soft warnings, hard failures, legacy grandfathering,
  growth beyond +2% and report integration, avoiding a repository-wide big-bang
  refactor while making new size debt visible.

## Completion rule

Before an agent reports a homelab task complete:

1. run the closest deterministic quality gate and inspect the final CI;
2. if a formatter/linter hook modifies files, commit the fixes and rerun the gate
   until the final pass is clean; a successful auto-fix pass is not itself a
   successful quality gate;
3. list every requested or discovered item that remains incomplete;
4. add each deferred item as an unchecked roadmap entry here (and in
   `docs/quality-roadmap.md` when it is cross-cutting);
5. never leave the only record of unfinished work in chat, a transient scratchpad
   or a TODO comment;
6. record any dependency on an unmerged upstream PR as pending rather than
   claiming it is implemented.
