#!/usr/bin/env bash
set -euo pipefail

# Read-only, bounded, network-free orientation before running expensive gates.
mode="${1:-context}"
if [[ "${mode}" != context && "${mode}" != preflight ]]; then
    echo 'usage: bash scripts/agent-offline-context.sh [context|preflight]' >&2
    exit 2
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo 'QG_OFFLINE_SOURCE_ONLY: no .git; run targeted archive tests, never publish from this tree' >&2
    if [[ "${mode}" == preflight ]]; then
        exit 1
    fi
    exit 0
fi

root="$(git rev-parse --show-toplevel)"
cd "${root}"
branch="$(git symbolic-ref --quiet --short HEAD || true)"
head="$(git rev-parse --verify HEAD)"
base=origin/master
if git symbolic-ref --quiet refs/remotes/origin/HEAD >/dev/null 2>&1; then
    base="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD)"
elif git rev-parse --verify origin/main >/dev/null 2>&1; then
    base=origin/main
fi

base_sha=unavailable
if git rev-parse --verify "${base}^{commit}" >/dev/null 2>&1; then
    base_sha="$(git rev-parse "${base}^{commit}")"
fi

# Path names only, capped to save model context; no secrets or file contents.
paths_file="$(mktemp)"
trap 'rm -f "${paths_file}"' EXIT
# A failed git diff must never produce a partial or deceptively empty inventory.
if ! (
    set -e
    if [[ "${base_sha}" != unavailable ]]; then
        git diff --name-only -z --diff-filter=ACMR "${base}...HEAD"
    fi
    git diff --name-only -z --diff-filter=ACMR
    git diff --cached --name-only -z --diff-filter=ACMR
    git ls-files -z --others --exclude-standard
) >"${paths_file}"; then
    echo 'QG_OFFLINE_GIT_DIFF_FAILED: inventory incomplete; refusing optimistic context' >&2
    exit 1
fi
mapfile -d '' -t paths < <(LC_ALL=C sort -zu "${paths_file}")
max_paths="${AGENT_OFFLINE_MAX_PATHS:-0}"
if [[ ! "${max_paths}" =~ ^(0|[1-9][0-9]*)$ ]]; then
    echo 'QG_OFFLINE_MAX_PATHS_INVALID: expected non-negative integer' >&2
    exit 2
fi
if ((max_paths > 0 && ${#paths[@]} > max_paths)); then
    printf 'QG_OFFLINE_PATH_LIMIT: changed=%s limit=%s; refusing incomplete inventory\n' "${#paths[@]}" "${max_paths}" >&2
    exit 1
fi

printf 'AGENT_CONTEXT branch=%s head=%s base=%s base_sha=%s changed=%s\n' \
    "${branch:-DETACHED}" "${head}" "${base}" "${base_sha}" "${#paths[@]}"
printf 'paths:'
for ((i = 0; i < ${#paths[@]} && i < 12; i++)); do
    printf ' %q' "${paths[i]}"
done
if ((${#paths[@]} > 12)); then
    printf ' (+%d more)' "$((${#paths[@]} - 12))"
fi
printf '\n'

if [[ "${mode}" != preflight ]]; then
    printf 'next: just preflight (cached refs only), then focused tests; publication requires the strict quality proof\n'
    exit 0
fi

if [[ -z "${branch}" || "${branch}" == "${base#origin/}" ]]; then
    echo 'QG_OFFLINE_PROTECTED_BRANCH: use a named non-default branch' >&2
    exit 1
fi
if [[ "${base_sha}" == unavailable ]]; then
    echo "QG_OFFLINE_BASE_MISSING: no cached ${base}; obtain an authorized Git ref/bundle before publication" >&2
    exit 1
fi
if ! git merge-base --is-ancestor "${base}" HEAD; then
    echo "QG_OFFLINE_BASE_STALE: ${base} is not an ancestor of HEAD; do not publish" >&2
    exit 1
fi
for tool in node npm pre-commit; do
    if ! command -v "${tool}" >/dev/null 2>&1; then
        printf 'QG_OFFLINE_TOOL_MISSING %s (strict publication unavailable)\n' "${tool}"
    fi
done
if [[ ! -d node_modules ]]; then
    echo 'QG_OFFLINE_DEPS_MISSING: npm dependencies unavailable; source-only tests remain possible'
fi
echo 'AGENT_OFFLINE_PREFLIGHT_OK: cached Git refs only; remote freshness and strict publish gate NOT proven'
