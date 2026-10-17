#!/usr/bin/env bash
set -euo pipefail

# Dependency-free regression test for the local pre-commit auto-fix loop.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUNCTION="$(sed -n '/^precommit_fix_until_stable() {/,/^}$/p' "${ROOT}/scripts/agent-quality-gate.sh")"
[[ -n "${FUNCTION}" ]] || {
    echo "QG_TEST_FUNCTION_MISSING" >&2
    exit 1
}
# Oscillation reporting helpers; run_case overrides the git/workspace shims.
# shellcheck source=scripts/lib/agent-quality-support.sh
source "${ROOT}/scripts/lib/agent-quality-support.sh"

run_case() (
    local scenario="$1" expected="$2"
    local tmp
    tmp="$(mktemp -d)"
    trap 'rm -rf "${tmp}"' EXIT
    export QG_TEST_STATE_FILE="${tmp}/state"
    export QG_TEST_SCENARIO="${scenario}"
    printf A >"${QG_TEST_STATE_FILE}"
    mkdir -p "${tmp}/bin"
    cat >"${tmp}/bin/pre-commit" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
case "${QG_TEST_SCENARIO}" in
    oscillate)
        if [[ "$(cat "${QG_TEST_STATE_FILE}")" == A ]]; then
            printf B >"${QG_TEST_STATE_FILE}"
        else
            printf A >"${QG_TEST_STATE_FILE}"
        fi
        printf 'fake formatter.....Failed\n- hook id: fake-formatter\n- exit code: 1\n- files were modified by this hook\n'
        exit 1
        ;;
    oscillate-silent)
        if [[ "$(cat "${QG_TEST_STATE_FILE}")" == A ]]; then
            printf B >"${QG_TEST_STATE_FILE}"
        else
            printf A >"${QG_TEST_STATE_FILE}"
        fi
        exit 1
        ;;
    converge)
        if [[ "$(cat "${QG_TEST_STATE_FILE}")" == A ]]; then
            printf B >"${QG_TEST_STATE_FILE}"
            exit 1
        fi
        exit 0
        ;;
    fail)
        exit 7
        ;;
esac
HOOK
    chmod +x "${tmp}/bin/pre-commit"
    export PATH="${tmp}/bin:${PATH}"
    export FIX_PASSES=12 LOG_TAIL=10
    collect_changed_files() { printf '%s\n' "${QG_TEST_STATE_FILE}"; }
    workspace_fingerprint() { cat "${QG_TEST_STATE_FILE}"; }
    git() {
        if [[ "$1" == status ]]; then
            printf ' M dummy.txt\n'
        else
            command git "$@"
        fi
    }
    # These are intentionally invoked by the dynamically loaded function.
    # Verify the shims directly, so ShellCheck can analyze their reachability.
    [[ "$(collect_changed_files)" == "${QG_TEST_STATE_FILE}" ]]
    [[ "$(workspace_fingerprint)" == A ]]
    [[ "$(git status --short)" == " M dummy.txt" ]]
    eval "${FUNCTION}"
    local rc=0
    precommit_fix_until_stable >"${tmp}/out" 2>&1 || rc=$?
    case "${expected}" in
        oscillate)
            [[ ${rc} -ne 0 ]] && grep -q QG_FIX_OSCILLATION "${tmp}/out" &&
                grep -qF 'QG_FIX_OSCILLATION_HOOKS: fake-formatter (passes 1 2)' "${tmp}/out" &&
                grep -qF "QG_FIX_OSCILLATION_FILES: ${QG_TEST_STATE_FILE} (passes 1 2)" "${tmp}/out"
            ;;
        oscillate-silent)
            [[ ${rc} -ne 0 ]] &&
                grep -qF 'QG_FIX_OSCILLATION_HOOKS: unknown (no hook reported modified files)' "${tmp}/out" &&
                grep -qF "QG_FIX_OSCILLATION_FILES: ${QG_TEST_STATE_FILE} (passes 1 2)" "${tmp}/out"
            ;;
        converge)
            [[ ${rc} -eq 0 ]] && grep -q 'converged after pass 2' "${tmp}/out"
            ;;
        fail)
            [[ ${rc} -eq 7 ]] && grep -q QG_PRECOMMIT_FAILED "${tmp}/out"
            ;;
    esac || {
        cat "${tmp}/out" >&2
        exit 1
    }
)
run_case oscillate oscillate
run_case oscillate-silent oscillate-silent
run_case converge converge
run_case fail fail
printf 'QG_OSCILLATION_CONTRACT_OK\n'
