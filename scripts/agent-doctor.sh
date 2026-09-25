#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

fail() {
    local code="$1"
    shift
    printf '❌ %s: %s\n' "${code}" "$*" >&2
    exit 1
}

tool_version() {
    local label="$1"
    shift
    if ! command -v "$1" >/dev/null 2>&1; then
        fail "AGENT_DOCTOR_TOOL_MISSING" "${label} is unavailable"
    fi
    "$@"
}

resolve_default_branch() {
    if git symbolic-ref --quiet refs/remotes/origin/HEAD >/dev/null 2>&1; then
        git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's#^origin/##'
    elif git rev-parse --verify origin/master >/dev/null 2>&1; then
        printf '%s\n' "master"
    elif git rev-parse --verify origin/main >/dev/null 2>&1; then
        printf '%s\n' "main"
    else
        printf '%s\n' "master"
    fi
}

CURRENT_BRANCH="$(git branch --show-current)"
[[ -n "${CURRENT_BRANCH}" ]] || fail "AGENT_DOCTOR_DETACHED_HEAD" "use a named non-default branch"

DEFAULT_BRANCH="$(resolve_default_branch)"
[[ "${CURRENT_BRANCH}" != "${DEFAULT_BRANCH}" ]] || fail "AGENT_DOCTOR_PROTECTED_BRANCH" "current branch is ${DEFAULT_BRANCH}"

BASE_REF="origin/${DEFAULT_BRANCH}"
git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1 || fail "AGENT_DOCTOR_BASE_MISSING" "fetch ${BASE_REF} before continuing"
git merge-base --is-ancestor "${BASE_REF}" HEAD >/dev/null 2>&1 || fail "AGENT_DOCTOR_BASE_STALE" "${BASE_REF} is not an ancestor of HEAD"

EXPECTED_NODE="$(tr -d '[:space:]' < .nvmrc)"
ACTUAL_NODE="$(tool_version node node --version)"
ACTUAL_NODE="${ACTUAL_NODE#v}"
[[ "${ACTUAL_NODE}" == "${EXPECTED_NODE}" ]] || fail "AGENT_DOCTOR_VERSION_MISMATCH" "node expected=${EXPECTED_NODE} actual=${ACTUAL_NODE}"

ACTUAL_NPM="$(tool_version npm npm --version)"
IFS=. read -r NPM_MAJOR NPM_MINOR _ <<<"${ACTUAL_NPM}"
[[ "${NPM_MAJOR}" == "11" && "${NPM_MINOR}" =~ ^[0-9]+$ && "${NPM_MINOR}" -ge 17 ]] || fail "AGENT_DOCTOR_VERSION_MISMATCH" "npm expected=>=11.17.0,<12 actual=${ACTUAL_NPM}"

EXPECTED_PYTHON="$(tr -d '[:space:]' < .python-version)"
ACTUAL_PYTHON="$(tool_version python3 python3 --version)"
ACTUAL_PYTHON="${ACTUAL_PYTHON#Python }"
[[ "${ACTUAL_PYTHON}" == "${EXPECTED_PYTHON}" ]] || fail "AGENT_DOCTOR_VERSION_MISMATCH" "python expected=${EXPECTED_PYTHON} actual=${ACTUAL_PYTHON}"

EXPECTED_PRECOMMIT="$(sed -n 's/^pre-commit = "\([^"]*\)"/\1/p' mise.toml | head -n1)"
[[ -n "${EXPECTED_PRECOMMIT}" ]] || fail "AGENT_DOCTOR_CONFIG_INVALID" "mise.toml does not pin pre-commit"
ACTUAL_PRECOMMIT="$(tool_version pre-commit pre-commit --version)"
ACTUAL_PRECOMMIT="${ACTUAL_PRECOMMIT#pre-commit }"
[[ "${ACTUAL_PRECOMMIT}" == "${EXPECTED_PRECOMMIT}" ]] || fail "AGENT_DOCTOR_VERSION_MISMATCH" "pre-commit expected=${EXPECTED_PRECOMMIT} actual=${ACTUAL_PRECOMMIT}"

for hook in pre-commit commit-msg pre-push; do
    HOOK_PATH="$(git rev-parse --git-path "hooks/${hook}")"
    [[ -x "${HOOK_PATH}" ]] || fail "AGENT_DOCTOR_HOOK_MISSING" "${hook} hook is not installed; run 'mise run hooks'"
done

[[ -d node_modules && -f node_modules/.package-lock.json ]] || fail "AGENT_DOCTOR_DEPS_MISSING" "run 'npm ci --no-audit --no-fund' before the strict local gate"

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
    printf 'working_tree=dirty\n'
else
    printf 'working_tree=clean\n'
fi

printf 'branch=%s\n' "${CURRENT_BRANCH}"
printf 'base=%s\n' "$(git rev-parse "${BASE_REF}^{commit}")"
printf 'head=%s\n' "$(git rev-parse HEAD)"
printf 'node=%s\n' "${ACTUAL_NODE}"
printf 'npm=%s\n' "${ACTUAL_NPM}"
printf 'python=%s\n' "${ACTUAL_PYTHON}"
printf 'pre-commit=%s\n' "${ACTUAL_PRECOMMIT}"
printf '✅ AGENT_DOCTOR_OK\n'
