# shellcheck shell=bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

NEXT_ENV="next-env.d.ts"

if ! git diff --quiet -- "${NEXT_ENV}" || ! git diff --cached --quiet -- "${NEXT_ENV}"; then
    echo "❌ A11Y_HARNESS_DIRTY_NEXT_ENV: restore next-env.d.ts before running accessibility tests." >&2
    exit 1
fi

NEXT_ENV_SNAPSHOT="$(mktemp)"
A11Y_LOG="$(mktemp)"
cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"

cleanup() {
    cp "${NEXT_ENV_SNAPSHOT}" "${NEXT_ENV}" 2>/dev/null || true
    rm -f "${NEXT_ENV_SNAPSHOT}" "${A11Y_LOG}"
}
trap cleanup EXIT INT TERM

rm -rf .next test-results

export PLAYWRIGHT_A11Y=1
export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3103}"
export PLAYWRIGHT_REUSE_SERVER=false

set +e
npx playwright test tests/accessibility-axe.spec.ts --project=chromium --reporter=line 2>&1 | tee "${A11Y_LOG}" | awk '
/\[WebServer\] \[browser\] Uncaught Error: Hydration failed because the server rendered HTML didn.t match the client\./ {
    hydration += 1
    suppress = 1
    next
}
suppress && /\[WebServer\]     at EndpointAction / {
    location = $0
    sub(/^.*at EndpointAction /, "", location)
    suppress = 0
    next
}
suppress { next }
{ print }
END {
    if (hydration > 0) {
        printf "\n⚠️ React hydration mismatch detected (%d occurrence%s)", hydration, hydration == 1 ? "" : "s"
        if (location != "") printf " · EndpointAction %s", location
        print ""
        print "   Full diagnostic retained in the local a11y log during execution and Playwright failure artifacts."
    }
}'
status=${PIPESTATUS[0]}
set -e

exit "${status}"
