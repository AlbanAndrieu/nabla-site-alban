#!/usr/bin/env bash
set -euo pipefail

# Canonical agent/human quality gate.
# Keep behavior aligned across Nabla repositories so publication policy does not drift.

PUBLISH=false
if [[ "${1:-}" == "--publish" ]]; then
    PUBLISH=true
    shift
fi
if (($# > 0)); then
    echo "usage: $0 [--publish]" >&2
    exit 2
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

if ! command -v pre-commit >/dev/null 2>&1; then
    echo "❌ pre-commit is required. Run 'mise run hooks' first."
    exit 1
fi

LOG_TAIL="${QUALITY_LOG_TAIL:-40}"

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

BASE_REF="$(resolve_base_ref)"

mapfile -t CHANGED_FILES < <(
    {
        if [[ "${BASE_REF}" != "HEAD" ]]; then
            git diff --name-only --diff-filter=ACMR "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } | awk 'NF' | sort -u | while IFS= read -r file; do
        [[ -f "${file}" ]] && printf '%s\n' "${file}"
    done
)

workspace_fingerprint() {
    {
        git diff --binary
        git diff --cached --binary
        for file in "${CHANGED_FILES[@]}"; do
            [[ -f "${file}" ]] || continue
            printf 'file:%s\n' "${file}"
            sha256sum "${file}"
        done
    } | sha256sum | awk '{print $1}'
}

if (("${#CHANGED_FILES[@]}" > 0)); then
    echo "🔧 Validating ${#CHANGED_FILES[@]} changed file(s)..."
    before="$(workspace_fingerprint)"
    log="$(mktemp)"
    pre_commit_args=(
        run
        --hook-stage pre-commit
        --fail-fast
        --files "${CHANGED_FILES[@]}"
    )
    if [[ "${QUALITY_SHOW_DIFF:-0}" == "1" ]]; then
        pre_commit_args+=(--show-diff-on-failure)
    fi

    set +e
    pre-commit "${pre_commit_args[@]}" >"${log}" 2>&1
    rc=$?
    set -e

    if ((rc != 0)); then
        after="$(workspace_fingerprint)"
        if [[ "${before}" != "${after}" ]]; then
            echo "❌ QG_AUTOFIX_REQUIRED: deterministic pre-commit hooks changed files." >&2
            echo "   Run 'npm run quality:agent:fix', review/commit the changes, then retry publication." >&2
            echo "   No CI-log analysis is required for this condition." >&2
            git status --short >&2
            echo "--- exact formatter patch ---" >&2
            git diff --no-ext-diff -- "${CHANGED_FILES[@]}" >&2 || true
            echo "--- end formatter patch ---" >&2
        else
            echo "❌ QG_PRECOMMIT_FAILED: pre-commit found a non-auto-fixed validation error." >&2
            tail -n "${LOG_TAIL}" "${log}" >&2 || true
        fi
        rm -f "${log}"
        exit "${rc}"
    fi
    rm -f "${log}"
    echo "✅ canonical pre-commit validation"
else
    echo "✅ No changed files require formatter/linter validation."
fi

echo "🔍 Checking whitespace errors..."
git diff --check
git diff --cached --check

if [[ "${PUBLISH}" == true ]]; then
    STATUS="$(git status --short)"
    if [[ -n "${STATUS}" ]]; then
        echo "❌ Working tree is not clean enough to publish." >&2
        echo "   Run 'npm run quality:agent:fix', review and commit the result, then retry." >&2
        printf '%s\n' "${STATUS}" >&2
        exit 1
    fi
    echo "✅ Publication quality gate passed; repository is clean and ready to publish."
else
    echo "✅ Quality gate passed. Review and commit the validated changes before publishing."
fi
