#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

restore_next_env() {
    if git ls-files --error-unmatch next-env.d.ts >/dev/null 2>&1; then
        git checkout -- next-env.d.ts
    fi
}

trap restore_next_env EXIT

exec_args=("$@")
npx next "${exec_args[@]}"
