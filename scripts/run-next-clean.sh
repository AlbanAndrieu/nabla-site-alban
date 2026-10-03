#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

NEXT_ENV="next-env.d.ts"
NEXT_ENV_SNAPSHOT=""

snapshot_next_env() {
    if git ls-files --error-unmatch "${NEXT_ENV}" >/dev/null 2>&1 && [[ -f "${NEXT_ENV}" ]]; then
        NEXT_ENV_SNAPSHOT="$(mktemp)"
        cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"
    fi
}

restore_next_env() {
    if [[ -n "${NEXT_ENV_SNAPSHOT}" && -f "${NEXT_ENV_SNAPSHOT}" ]]; then
        cp "${NEXT_ENV_SNAPSHOT}" "${NEXT_ENV}"
        rm -f "${NEXT_ENV_SNAPSHOT}"
    fi
}

snapshot_next_env
trap restore_next_env EXIT INT TERM

npx next "$@"
