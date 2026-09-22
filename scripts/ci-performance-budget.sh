#!/usr/bin/env bash
set -euo pipefail

# Warning-only budgets. Keep enough headroom for hosted-runner/cache variance;
# compare multiple exact-checkout baselines before changing or blocking on them.
NPM_CI_WARN_SECONDS="${NPM_CI_WARN_SECONDS:-45}"
NODE_MODULES_WARN_MB="${NODE_MODULES_WARN_MB:-1000}"
AGENT_GATE_WARN_SECONDS="${AGENT_GATE_WARN_SECONDS:-90}"
NEXT_BUILD_WARN_SECONDS="${NEXT_BUILD_WARN_SECONDS:-45}"
NEXT_OUTPUT_WARN_MB="${NEXT_OUTPUT_WARN_MB:-150}"

warned=0

is_number() {
    [[ "$1" =~ ^[0-9]+([.][0-9]+)?$ ]]
}

above() {
    awk -v value="$1" -v budget="$2" 'BEGIN { exit !(value > budget) }'
}

value_or_na() {
    if [[ -n "$1" ]]; then
        printf '%s' "$1"
    else
        printf 'n/a'
    fi
}

check_budget() {
    local label="$1"
    local value="$2"
    local budget="$3"
    local unit="$4"

    if [[ -z "${value}" || "${value}" == "n/a" ]]; then
        printf 'ℹ️ %s: not measured for this quality scope\n' "${label}"
        return 0
    fi
    if ! is_number "${value}" || ! is_number "${budget}"; then
        printf '::warning::CI performance budget for %s could not be evaluated (value=%s, budget=%s).\n' \
            "${label}" "${value}" "${budget}"
        warned=1
        return 0
    fi
    if above "${value}" "${budget}"; then
        printf '::warning::CI performance regression candidate: %s=%s%s exceeds warning budget %s%s. Compare cache state and recent master baselines before treating this as blocking.\n' \
            "${label}" "${value}" "${unit}" "${budget}" "${unit}"
        warned=1
    else
        printf '✅ %s=%s%s ≤ warning budget %s%s\n' \
            "${label}" "${value}" "${unit}" "${budget}" "${unit}"
    fi
}

check_budget "npm ci" "${NPM_CI_SECONDS:-}" "${NPM_CI_WARN_SECONDS}" "s"
check_budget "node_modules" "${NODE_MODULES_MB:-}" "${NODE_MODULES_WARN_MB}" "MiB"
check_budget "agent gate" "${AGENT_GATE_SECONDS:-}" "${AGENT_GATE_WARN_SECONDS}" "s"
check_budget "Next build" "${NEXT_BUILD_SECONDS:-}" "${NEXT_BUILD_WARN_SECONDS}" "s"
check_budget ".next output" "${NEXT_MB:-}" "${NEXT_OUTPUT_WARN_MB}" "MiB"

scope_name="maintenance"
if [[ "${SAST_REQUIRED:-false}" == "true" ]]; then
    scope_name="security"
fi
if [[ "${BUILD_REQUIRED:-false}" == "true" ]]; then
    scope_name="application"
fi

checkout_sha="$(git rev-parse HEAD 2>/dev/null || true)"
baseline_ref="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}"
node_version="$(node --version 2>/dev/null || true)"
npm_version="$(npm --version 2>/dev/null || true)"
baseline_record="CI_PERF_BASELINE schema=1 run=$(value_or_na "${GITHUB_RUN_ID:-}") run_number=$(value_or_na "${GITHUB_RUN_NUMBER:-}") attempt=$(value_or_na "${GITHUB_RUN_ATTEMPT:-}") sha=$(value_or_na "${checkout_sha}") ref=$(value_or_na "${baseline_ref}") event=$(value_or_na "${GITHUB_EVENT_NAME:-}") runner=$(value_or_na "${RUNNER_OS:-}")-$(value_or_na "${RUNNER_ARCH:-}") node=$(value_or_na "${node_version}") npm=$(value_or_na "${npm_version}") scope=${scope_name} npm_cache_hit=$(value_or_na "${NPM_CACHE_HIT:-}") next_cache_hit=$(value_or_na "${NEXT_CACHE_HIT:-}") npm_ci_s=$(value_or_na "${NPM_CI_SECONDS:-}") node_modules_mb=$(value_or_na "${NODE_MODULES_MB:-}") agent_gate_s=$(value_or_na "${AGENT_GATE_SECONDS:-}") next_build_s=$(value_or_na "${NEXT_BUILD_SECONDS:-}") next_output_mb=$(value_or_na "${NEXT_MB:-}")"
printf '%s\n' "${baseline_record}"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    {
        echo
        echo "### CI performance warning budgets"
        echo
        echo "- npm ci: ${NPM_CI_WARN_SECONDS}s"
        echo "- node_modules: ${NODE_MODULES_WARN_MB} MiB"
        echo "- agent gate: ${AGENT_GATE_WARN_SECONDS}s"
        echo "- Next build: ${NEXT_BUILD_WARN_SECONDS}s"
        echo "- .next output: ${NEXT_OUTPUT_WARN_MB} MiB"
        echo "- policy: warning-only; compare multiple exact-checkout baselines before tightening"
        echo
        echo "#### Copy-ready baseline record"
        echo
        printf '`%s`\n' "${baseline_record}"
    } >>"${GITHUB_STEP_SUMMARY}"
fi

if ((warned != 0)); then
    echo "⚠️ one or more CI performance budgets need review; quality result remains non-blocking"
else
    echo "✅ measured CI performance is within warning budgets"
fi
