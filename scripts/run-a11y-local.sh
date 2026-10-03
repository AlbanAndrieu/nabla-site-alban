#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

NEXT_ENV="next-env.d.ts"
NEXT_ENV_SNAPSHOT="$(mktemp)"
trap 'cp "${NEXT_ENV_SNAPSHOT}" "${NEXT_ENV}" 2>/dev/null || true; rm -f "${NEXT_ENV_SNAPSHOT}"' EXIT INT TERM

if ! git diff --quiet -- "${NEXT_ENV}"; then
    echo "❌ A11Y_HARNESS_DIRTY_NEXT_ENV: restore next-env.d.ts before running accessibility tests." >&2
    exit 1
fi

cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"
rm -rf .next test-results

export PLAYWRIGHT_A11Y=1
export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3103}"
export PLAYWRIGHT_REUSE_SERVER=false

npx playwright test tests/accessibility-axe.spec.ts --project=chromium --reporter=line
