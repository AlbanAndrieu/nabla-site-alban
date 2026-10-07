# Local-first shortcuts. Makefile is deliberately retained.
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

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
