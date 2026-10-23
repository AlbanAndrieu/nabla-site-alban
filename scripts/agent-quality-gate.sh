#!/usr/bin/env bash
set -euo pipefail

# Repository-specific agent-first pre-build gate.
# The canonical scripts/quality-gate.sh stays focused on changed-file
# formatter/linter/security checks; this wrapper adds Site Alban preflight checks.

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

# shellcheck source=scripts/lib/agent-quality-support.sh
source scripts/lib/agent-quality-support.sh
# shellcheck source=scripts/lib/agent-quality-guards.sh
source scripts/lib/agent-quality-guards.sh

MODE="check"
PUBLISH=false
case "${1:-}" in
    --fix)
        MODE="fix"
        shift
        ;;
    --publish)
        PUBLISH=true
        shift
        ;;
    -h | --help)
        print_agent_quality_usage
        exit 0
        ;;
    "")
        ;;
    *)
        printf '❌ unknown argument: %s\n' "$1" >&2
        exit 2
        ;;
esac

if (($# > 0)); then
    printf '❌ unexpected argument: %s\n' "$1" >&2
    exit 2
fi

LOG_TAIL="${QUALITY_LOG_TAIL:-20}"
FIX_PASSES="${QUALITY_FIX_PASSES:-12}"
if [[ ! "${FIX_PASSES}" =~ ^[1-9][0-9]*$ ]]; then
    echo "❌ QUALITY_FIX_PASSES must be a positive integer" >&2
    exit 2
fi

BASE_REF="$(resolve_base_ref)"

precommit_fix_until_stable() {
    local pass
    local before
    local after
    local log
    local rc
    local before_digests
    # Per-pass hook/file evidence used to name the sources of an oscillation.
    local evidence=""
    declare -A seen_fingerprints=()

    for ((pass = 1; pass <= FIX_PASSES; pass++)); do
        mapfile -t fix_files < <(collect_changed_files)
        if (("${#fix_files[@]}" == 0)); then
            echo "✅ no changed files require pre-commit auto-fixes"
            return 0
        fi

        before="$(workspace_fingerprint)"
        if [[ -n "${seen_fingerprints[${before}]:-}" ]]; then
            printf '❌ QG_FIX_OSCILLATION: workspace fingerprint repeated (passes %s and %s).\n' \
                "${seen_fingerprints[${before}]}" "${pass}" >&2
            report_fix_oscillation "${seen_fingerprints[${before}]}" "${pass}" "${evidence}" >&2
            printf '   Inspect changed paths and the mutating pre-commit hooks.\n' >&2
            git status --short >&2
            return 1
        fi
        seen_fingerprints["${before}"]="${pass}"
        before_digests="$(fix_file_digests "${fix_files[@]}")"
        log="$(mktemp)"
        set +e
        pre-commit run --hook-stage pre-commit --files "${fix_files[@]}" >"${log}" 2>&1
        rc=$?
        set -e
        after="$(workspace_fingerprint)"
        evidence+="$(fix_pass_evidence "${pass}" "${log}" "${before_digests}" "$(fix_file_digests "${fix_files[@]}")")"$'\n'

        if ((rc == 0)); then
            rm -f "${log}"
            printf '✅ pre-commit auto-fix converged after pass %d\n' "${pass}"
            return 0
        fi

        if [[ "${before}" != "${after}" ]]; then
            printf '🔧 pre-commit pass %d/%d applied deterministic fixes; retrying without log analysis\n' \
                "${pass}" "${FIX_PASSES}"
            rm -f "${log}"
            continue
        fi

        echo "❌ QG_PRECOMMIT_FAILED: auto-fix made no further progress." >&2
        if [[ "${QUALITY_VERBOSE:-0}" == "1" ]]; then
            cat "${log}" >&2
        else
            tail -n "${LOG_TAIL}" "${log}" >&2 || true
        fi
        rm -f "${log}"
        return "${rc}"
    done

    echo "❌ QG_FIX_DID_NOT_CONVERGE: pre-commit kept changing files after ${FIX_PASSES} passes." >&2
    echo "   Inspect 'git status --short' and only the relevant changed files." >&2
    git status --short >&2
    return 1
}

mapfile -t CHANGED_FILES < <(collect_changed_files)
mapfile -t DELETED_FILES < <(collect_deleted_files)

command -v pre-commit >/dev/null 2>&1 || {
    echo "❌ pre-commit is required; run 'mise run hooks' or install the agent bootstrap dependencies" >&2
    exit 1
}

classify_changed_files "${CHANGED_FILES[@]}"

if [[ "${MODE}" != "fix" && "${agent_gate_changed}" == true && "${QUALITY_CANONICAL_GATE_VERIFIED:-0}" != "1" ]]; then
    run_compact "agent gate shell formatting" \
        pre-commit run shfmt --files "${AGENT_GATE_SHELL_FILES[@]}"
    run_compact "agent gate shell lint" \
        pre-commit run shell-lint --files "${AGENT_GATE_SHELL_FILES[@]}"
    run_compact "agent gate shell style" \
        pre-commit run bashate --files "${AGENT_GATE_SHELL_FILES[@]}"
fi

if [[ "${MODE}" == "fix" ]]; then
    precommit_fix_until_stable

    if [[ "${javascript_lint_all}" == true || "${stylelint_all}" == true || "${#JAVASCRIPT_LINT_FILES[@]}" -gt 0 || "${#STYLELINT_FILES[@]}" -gt 0 ]]; then
        if command -v npm >/dev/null 2>&1 && [[ -d node_modules ]]; then
            if [[ "${javascript_lint_all}" == true ]]; then
                run_compact "ESLint local auto-fix" npm run lint:fix
            elif (("${#JAVASCRIPT_LINT_FILES[@]}" > 0)); then
                run_compact "ESLint changed-file auto-fix" \
                    npx eslint --fix --format ./scripts/eslint-github-formatter.mjs "${JAVASCRIPT_LINT_FILES[@]}"
            fi
            if [[ "${stylelint_all}" == true ]]; then
                run_compact "Stylelint local auto-fix" npm run lint:css:fix
            elif (("${#STYLELINT_FILES[@]}" > 0)); then
                run_compact "Stylelint changed-file auto-fix" \
                    npx stylelint --fix "${STYLELINT_FILES[@]}"
            fi
            # npm lint auto-fixes may change files covered by Biome/other hooks.
            precommit_fix_until_stable
        else
            echo "⚠️ QG_NODE_FIX_SKIPPED: node_modules unavailable; pre-commit fixes ran, but npm lint auto-fixes were skipped." >&2
            echo "   Run 'npm ci --no-audit --no-fund' before the strict publication gate." >&2
        fi
    fi

    echo "✅ deterministic local auto-fix phase converged."
    git status --short
    echo "ℹ️ review the short diff, commit the result, then let the pre-push publication gate validate it."
    exit 0
fi

if [[ "${BASE_REF}" != "HEAD" ]]; then
    if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
        printf '❌ QG_BASE_MISSING: comparison base %s is unavailable\n' "${BASE_REF}" >&2
        exit 1
    fi
    if ! git merge-base --is-ancestor "${BASE_REF}" HEAD; then
        printf '❌ QG_BASE_STALE: HEAD does not contain %s; fetch/rebase before publishing\n' "${BASE_REF}" >&2
        exit 1
    fi
    printf '✅ branch contains comparison base %s\n' "${BASE_REF}"
fi

check_large_deletions || exit 1
printf '✅ destructive-diff guard\n'

check_executable_bits || exit 1
printf '✅ executable-script contract\n'

if (("${#CHANGED_FILES[@]}" > 0)); then
    run_compact_report "baseline-aware code-size report" \
        python3 scripts/check_code_size.py \
        --baseline-ref "${BASE_REF}" \
        "${CHANGED_FILES[@]}"
else
    echo "✅ baseline-aware code-size report (no changed files)"
fi

command -v npm >/dev/null 2>&1 || {
    echo "❌ npm is required" >&2
    exit 1
}
if [[ ! -d node_modules ]]; then
    echo "❌ JavaScript dependencies are missing; run 'npm ci --no-audit --no-fund' first" >&2
    exit 1
fi

if [[ "${PUBLISH}" == true ]]; then
    run_compact "canonical formatter/linter/security publication gate" \
        bash scripts/quality-gate.sh --publish
elif [[ "${QUALITY_CANONICAL_GATE_VERIFIED:-0}" == "1" ]]; then
    echo "✅ canonical formatter/linter/security gate already verified earlier in this CI job"
else
    run_compact "canonical formatter/linter/security gate" \
        bash scripts/quality-gate.sh
fi

scope_output="$(bash scripts/ci-scope.sh "${BASE_REF}" HEAD)"
printf '%s\n' "${scope_output}"
build="$(awk -F= '$1 == "build" { print $2; exit }' <<<"${scope_output}")"

# Route types are required by TypeScript even when a maintenance-only PR
# does not need a deployable Next.js build. Keep one shared check sequence.
run_project_checks() {
    npm run lint &&
        npm run lint:css &&
        npx next typegen &&
        npm run typecheck &&
        npm run test:unit
}

case "${build}" in
    true)
        run_compact "full pre-build lint, route types, TypeScript and unit gate" run_project_checks
        ;;
    false)
        run_compact "maintenance lint, CSS, route types, TypeScript and unit gate" run_project_checks
        ;;
    *)
        printf '❌ QG_SCOPE_INVALID: ci-scope returned build=%s\n' "${build:-missing}" >&2
        exit 1
        ;;
esac

if [[ "${PUBLISH}" == true ]]; then
    STATUS="$(git status --short)"
    if [[ -n "${STATUS}" ]]; then
        echo "❌ Working tree changed during the agent publication gate." >&2
        printf '%s\n' "${STATUS}" >&2
        exit 1
    fi
    echo "✅ Agent publication gate passed; repository is clean and safe to publish."
else
    echo "✅ Agent pre-build quality gate passed."
fi
