#!/usr/bin/env bash
set -euo pipefail

# Fast local-first feedback, inspired by nabla-compose's agent loop.
# NEVER a substitute for npm run quality:agent:publish.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
source scripts/lib/agent-quality-support.sh
BASE_REF="$(resolve_base_ref)"

# Prevent a misleading empty run when the cached base cannot be located.
if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
    echo "QG_LOOP_BASE_MISSING: obtain a cached comparison ref before validation" >&2
    exit 1
fi
if ! git merge-base "${BASE_REF}" HEAD >/dev/null 2>&1; then
    echo "QG_LOOP_BASE_UNRELATED: cannot compare HEAD to ${BASE_REF}" >&2
    exit 1
fi
command -v pre-commit >/dev/null 2>&1 || {
    echo "QG_LOOP_PRECOMMIT_MISSING: install hooks with mise run hooks" >&2
    exit 1
}
mapfile -t changed < <(collect_changed_files)
if (( ${#changed[@]} == 0 )); then
    echo "QG_LOOP_NO_CHANGES: no changed files; strict publication gate still required"
    exit 0
fi
printf 'QG_LOOP_SCOPE: %d changed files\n' "${#changed[@]}"
pre-commit run --hook-stage pre-commit --files "${changed[@]}" --show-diff-on-failure
git diff --check
git diff --cached --check
echo "QG_LOOP_L2_PASS: changed-file hooks only; lint/typecheck/unit/build/publish NOT_RUN"
