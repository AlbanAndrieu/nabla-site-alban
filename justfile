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

legacy-help:
    make help
