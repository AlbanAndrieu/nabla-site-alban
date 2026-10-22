# Local-first shortcuts. Makefile is deliberately retained.
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

# Network-free, bounded diagnostics. Neither is a publication proof.
context:
    bash scripts/agent-offline-context.sh context

preflight:
    bash scripts/agent-offline-context.sh preflight

# Offline L1 syntax-only fallback, aligned with Bababou.
offline-l1:
    bash scripts/agent-offline-check.sh

# SHA/digest come from the exact-head Dagger GitHub artifact.
snapshot-check archive head digest destination:
    python3 scripts/agent-source-snapshot.py "{{archive}}" "{{head}}" "{{digest}}" "{{destination}}"

# Dependency-free targeted verification; never a substitute for the publication gate.
source-check:
    bash -n scripts/agent-offline-context.sh scripts/agent-quality-gate.sh scripts/test-agent-quality-oscillation.sh scripts/k8s/smoke-standalone.sh
    bash scripts/test-agent-quality-oscillation.sh
    node --experimental-strip-types --test unit-tests/agentOfflineLoop.test.ts unit-tests/agentSourceSnapshot.test.ts
    node --test unit-tests/ciBudgetConvergence.test.mjs unit-tests/k8sStandaloneContract.test.mjs
    python3 -m unittest discover -s unit-tests -p "test_github_actions_usage.py"
    @echo "QG_SOURCE_CHECK_OK: targeted offline smoke only; publication gate NOT_RUN"

npm-offline-check:
    bash scripts/agent-npm-offline.sh check

npm-offline-install:
    bash scripts/agent-npm-offline.sh install

dev:
    npm run dev

build:
    npm run build

check:
    npm run check

lint:
    npm run lint
    npm run lint:css

typecheck:
    npm run typecheck

unit:
    npm run test:unit

a11y:
    npm run test:a11y

quality:
    npm run quality:agent

quality-fix:
    npm run quality:agent:fix

publish:
    npm run quality:agent:publish

hooks:
    mise run hooks

# GitHub Actions budget: read-only local tests and bounded real usage inventory.
actions-usage-test:
    python3 -m unittest discover -s unit-tests -p "test_github_actions_usage.py" -v

actions-usage days="30" max_runs="40":
    python3 scripts/github-actions-usage.py --days "{{days}}" --max-runs "{{max_runs}}"

secrets:
    betterleaks dir . --config .betterleaks.toml --redact

secrets-history:
    betterleaks git . --config .betterleaks.toml --redact

# Experimental and non-blocking until the roadmap parity criteria are met.
dagger-check:
    dagger call check --source=.

dagger-check-node26:
    dagger call check-node26 --source=.

# Warm-cache comparison: Dagger Node 26 parity vs the current npm check.
bench-dev-loop:
    hyperfine --warmup 1 --min-runs 3 \
        'dagger call check-node26 --source=.' \
        'npm run check'

legacy-help:
    make help


# Experimental hook-runner benchmark. Keep pre-commit authoritative.
# Run only from a clean, already-valid tree because formatter hooks may write.
bench-hook-runners:
    @test -z "$(git status --porcelain)" || (echo "Refusing benchmark: working tree must be clean" >&2; exit 1)
    hyperfine --warmup 1 --min-runs 3 \
        'pre-commit run --hook-stage pre-commit --all-files' \
        'prek run --hook-stage pre-commit --all-files'
    @test -z "$(git status --porcelain)" || (echo "Hook benchmark changed the working tree; inspect before continuing" >&2; exit 1)

# hk is benchmark-only: hk.pkl defines a custom hook and does not install/replace Git hooks.
hk-fast-check:
    hk run fast-check

bench-fast-check:
    hyperfine --warmup 1 --min-runs 3 \
        'hk run fast-check' \
        'npm run lint && npm run lint:css && npm run typecheck'

# Talos private staging: never starts a GitHub workflow or deploys automatically.
k8s-contract:
    node --test unit-tests/k8sStandaloneContract.test.mjs

k8s-build tag="nabla-site-alban:talos":
    docker build --pull -f Dockerfile.k8s -t "{{tag}}" .

k8s-smoke tag="nabla-site-alban:talos":
    bash scripts/k8s/smoke-standalone.sh "{{tag}}"
