# Local-first shortcuts. Makefile is deliberately retained.
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

# Network-free, bounded diagnostics. Neither is a publication proof.
context:
    bash scripts/agent-offline-context.sh context

preflight:
    bash scripts/agent-offline-context.sh preflight

# SHA/digest come from the exact-head Dagger GitHub artifact.
snapshot-check archive head digest destination:
    python3 scripts/agent-source-snapshot.py "{{archive}}" "{{head}}" "{{digest}}" "{{destination}}"

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
