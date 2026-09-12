# shellcheck shell=bash
# shellcheck disable=SC2034
# Shared mechanics for scripts/agent-quality-gate.sh.
# This file is sourced by the agent gate; it is intentionally not executable and
# does not own formatter, linter, security or publication policy.

print_agent_quality_usage() {
    cat <<'EOF'
Usage:
    bash scripts/agent-quality-gate.sh [--fix|--publish]

Modes:
    default    strict deterministic pre-build validation
    --fix      converge deterministic pre-commit + npm lint auto-fixes locally
    --publish  strict gate plus clean-tree publication validation

Environment:
    QUALITY_BASE_REF                    override comparison base
    QUALITY_LOG_TAIL                    failure log lines to print (default: 40)
    QUALITY_FIX_PASSES                  maximum local pre-commit fix passes (default: 12)
    QUALITY_CANONICAL_GATE_VERIFIED=1   CI-only: canonical gate already passed in this job
    QUALITY_ALLOW_LARGE_DELETION=1      acknowledge an intentional large truncation
EOF
}

resolve_base_ref() {
    if [[ -n "${QUALITY_BASE_REF:-}" ]]; then
        printf '%s\n' "${QUALITY_BASE_REF}"
    elif git symbolic-ref --quiet refs/remotes/origin/HEAD >/dev/null 2>&1; then
        git symbolic-ref --quiet --short refs/remotes/origin/HEAD
    elif git rev-parse --verify origin/main >/dev/null 2>&1; then
        printf '%s\n' "origin/main"
    elif git rev-parse --verify origin/master >/dev/null 2>&1; then
        printf '%s\n' "origin/master"
    elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
        printf '%s\n' "HEAD~1"
    else
        printf '%s\n' "HEAD"
    fi
}

run_compact() {
    local label="$1"
    shift
    local log
    local rc
    log="$(mktemp)"
    if "$@" >"${log}" 2>&1; then
        rm -f "${log}"
        printf '✅ %s\n' "${label}"
        return 0
    else
        rc=$?
    fi
    printf '❌ %s\n' "${label}" >&2
    tail -n "${LOG_TAIL}" "${log}" >&2 || true
    rm -f "${log}"
    return "${rc}"
}

run_compact_report() {
    local label="$1"
    shift
    local log
    local rc
    log="$(mktemp)"
    if "$@" >"${log}" 2>&1; then
        grep -E '^(WARNING |Code-size gate:)' "${log}" || true
        rm -f "${log}"
        printf '✅ %s\n' "${label}"
        return 0
    else
        rc=$?
    fi
    printf '❌ %s\n' "${label}" >&2
    tail -n "${LOG_TAIL}" "${log}" >&2 || true
    rm -f "${log}"
    return "${rc}"
}

collect_changed_files() {
    {
        if [[ "${BASE_REF}" != "HEAD" ]] && git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
            git diff --name-only --diff-filter=ACMR "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } |
        awk 'NF' |
        sort -u |
        while IFS= read -r file; do
            [[ -f "${file}" ]] && printf '%s\n' "${file}"
        done
}

collect_deleted_files() {
    {
        if [[ "${BASE_REF}" != "HEAD" ]] && git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
            git diff --name-only --diff-filter=D "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=D
        git diff --cached --name-only --diff-filter=D
    } |
        awk 'NF' |
        sort -u
}

workspace_fingerprint() {
    local file
    {
        git diff --binary
        git diff --cached --binary
        git status --porcelain=v1 --untracked-files=all
        while IFS= read -r file; do
            [[ -f "${file}" ]] || continue
            printf 'file:%s\n' "${file}"
            sha256sum "${file}"
        done < <(collect_changed_files)
    } | sha256sum | awk '{print $1}'
}

classify_changed_files() {
    local file
    agent_gate_changed=false
    javascript_lint_all=false
    stylelint_all=false
    AGENT_GATE_SHELL_FILES=()
    JAVASCRIPT_LINT_FILES=()
    STYLELINT_FILES=()

    for file in "$@"; do
        case "${file}" in
            scripts/agent-quality-gate.sh | scripts/lib/agent-quality-support.sh)
                agent_gate_changed=true
                AGENT_GATE_SHELL_FILES+=("${file}")
                ;;
        esac
        case "${file}" in
            eslint.config.js)
                javascript_lint_all=true
                ;;
            *.js | *.jsx | *.mjs | *.cjs | *.ts | *.tsx)
                JAVASCRIPT_LINT_FILES+=("${file}")
                ;;
        esac
        case "${file}" in
            stylelint.config.cjs)
                stylelint_all=true
                ;;
            *.css)
                STYLELINT_FILES+=("${file}")
                ;;
        esac
    done
}
