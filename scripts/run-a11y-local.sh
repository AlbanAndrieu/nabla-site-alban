# shellcheck shell=bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

NEXT_ENV="next-env.d.ts"
A11Y_ARTIFACT_DIR="test-results"
A11Y_LOG="${A11Y_ARTIFACT_DIR}/a11y-playwright.log"

if ! git diff --quiet -- "${NEXT_ENV}" || ! git diff --cached --quiet -- "${NEXT_ENV}"; then
    echo "❌ A11Y_HARNESS_DIRTY_NEXT_ENV: restore next-env.d.ts before running accessibility tests." >&2
    exit 1
fi

NEXT_ENV_SNAPSHOT="$(mktemp)"
cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"

cleanup() {
    cp "${NEXT_ENV_SNAPSHOT}" "${NEXT_ENV}" 2>/dev/null || true
    rm -f "${NEXT_ENV_SNAPSHOT}"
}
trap cleanup EXIT INT TERM

rm -rf .next "${A11Y_ARTIFACT_DIR}"
mkdir -p "${A11Y_ARTIFACT_DIR}"

export PLAYWRIGHT_A11Y=1
export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3103}"
export PLAYWRIGHT_REUSE_SERVER=false

set +e
npx playwright test tests/accessibility-axe.spec.ts --project=chromium --reporter=line >"${A11Y_LOG}" 2>&1
status=$?
set -e

if (( status == 0 )); then
    summary="$(grep -E '^[[:space:]]*[0-9]+ passed' "${A11Y_LOG}" | tail -1 || true)"
    printf '✅ Axe EN/FR: %s\n' "${summary:-all accessibility tests passed}"
    exit 0
fi

echo "❌ Axe EN/FR failed (exit ${status})"

grep -E '^[[:space:]]*[0-9]+\) \[|^[[:space:]]*Error: (aria-|color-contrast|[a-z0-9-]+ \[)|^[[:space:]]*[0-9]+ failed|^[[:space:]]*[0-9]+ passed' "${A11Y_LOG}" \
    | sed -E 's/^([[:space:]]*Error: .{0,900}).*/\1/' \
    | head -n 24 || true

hydration_count="$(grep -c 'Hydration failed because the server rendered HTML' "${A11Y_LOG}" || true)"
if (( hydration_count > 0 )); then
    hydration_location="$(grep -m1 -E 'at (EndpointAction|HomelabServiceGrid|Architecture)' "${A11Y_LOG}" | sed -E 's/^.*at /at /' || true)"
    printf '⚠️ React hydration mismatch: %d occurrence%s' "${hydration_count}" "$([[ "${hydration_count}" == 1 ]] && printf '' || printf 's')"
    [[ -n "${hydration_location}" ]] && printf ' · %s' "${hydration_location}"
    printf '\n'
fi

http_502_count="$(grep -c 'HTTP 502' "${A11Y_LOG}" || true)"
if (( http_502_count > 0 )); then
    printf '⚠️ FastAPI fallback noise: %d HTTP 502 occurrence%s (details in artifact)\n' "${http_502_count}" "$([[ "${http_502_count}" == 1 ]] && printf '' || printf 's')"
fi

printf '📎 Full Playwright log: %s\n' "${A11Y_LOG}"
printf '📎 Failure screenshots/context: %s/\n' "${A11Y_ARTIFACT_DIR}"

exit "${status}"
