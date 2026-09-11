#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

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

toolchain_fingerprint() {
    {
        printf 'node=%s\n' "$(node --version)"
        printf 'npm=%s\n' "$(npm --version)"
        printf 'python=%s\n' "$(python3 --version 2>&1)"
        printf 'pre-commit=%s\n' "$(pre-commit --version)"
        if [[ -f node_modules/.package-lock.json ]]; then
            printf 'node-modules-lock='
            sha256sum node_modules/.package-lock.json | awk '{print $1}'
        else
            printf 'node-modules-lock=missing\n'
        fi
    } | sha256sum | awk '{print $1}'
}

BASE_REF="$(resolve_base_ref)"
if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ QG_PUBLISH_BASE_MISSING: comparison base %s is unavailable\n' "${BASE_REF}" >&2
    exit 1
fi

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
    echo "❌ QG_PUBLISH_DIRTY: commit the intended batch before publication validation." >&2
    printf '%s\n' "${STATUS}" >&2
    exit 1
fi

HEAD_SHA="$(git rev-parse HEAD)"
BASE_SHA="$(git rev-parse "${BASE_REF}^{commit}")"
TOOLCHAIN_SHA="$(toolchain_fingerprint)"
PROOF_VERSION="v1"
PROOF_KEY="${PROOF_VERSION}|${HEAD_SHA}|${BASE_SHA}|${TOOLCHAIN_SHA}"
PROOF_FILE="$(git rev-parse --git-path agent-publication-proof)"

if [[ -f "${PROOF_FILE}" ]] && [[ "$(cat "${PROOF_FILE}")" == "${PROOF_KEY}" ]]; then
    echo "✅ QG_PUBLISH_PROOF_REUSED: HEAD/base/toolchain unchanged; strict publication gate already passed."
    exit 0
fi

QUALITY_BASE_REF="${BASE_SHA}" bash scripts/agent-quality-gate.sh --publish

mkdir -p "$(dirname "${PROOF_FILE}")"
PROOF_TMP="$(mktemp "${PROOF_FILE}.XXXXXX")"
trap 'rm -f "${PROOF_TMP}"' EXIT
printf '%s\n' "${PROOF_KEY}" >"${PROOF_TMP}"
mv "${PROOF_TMP}" "${PROOF_FILE}"
trap - EXIT

echo "✅ QG_PUBLISH_PROOF_WRITTEN: strict publication proof cached for this HEAD/base/toolchain."
