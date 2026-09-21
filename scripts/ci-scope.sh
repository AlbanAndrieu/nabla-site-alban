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

BASE_REF="${1:-$(resolve_base_ref)}"
HEAD_REF="${2:-HEAD}"

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ CI_SCOPE_BASE_MISSING: %s\n' "${BASE_REF}" >&2
    exit 1
fi
if ! git rev-parse --verify "${HEAD_REF}^{commit}" >/dev/null 2>&1; then
    printf '❌ CI_SCOPE_HEAD_MISSING: %s\n' "${HEAD_REF}" >&2
    exit 1
fi

is_maintenance_only_path() {
    case "$1" in
        docs/* | \
            unit-tests/* | \
            *.md | \
            .pre-commit-config.yaml | \
            .pre-commit-pre-push.yaml | \
            scripts/agent-quality-gate.sh | \
            scripts/lib/agent-quality-support.sh | \
            scripts/agent-publish.sh | \
            scripts/quality-gate.sh | \
            scripts/check_code_size.py | \
            scripts/ci-scope.sh | \
            scripts/verify-production-baseline.sh | \
            scripts/publish-vercel-preview-checkpoint.sh | \
            scripts/eslint-github-formatter.mjs)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

is_preview_safe_path() {
    case "$1" in
        docs/* | \
            unit-tests/* | \
            *.md | \
            .github/* | \
            .zap/* | \
            .vscode/* | \
            .idea/* | \
            .agents/* | \
            .cursor/* | \
            .claude/* | \
            .assetsignore | \
            .pre-commit-config.yaml | \
            .pre-commit-pre-push.yaml | \
            .python-version | \
            mise.toml | \
            eslint.config.js | \
            stylelint.config.cjs | \
            scripts/agent-quality-gate.sh | \
            scripts/lib/agent-quality-support.sh | \
            scripts/agent-publish.sh | \
            scripts/check_code_size.py | \
            scripts/ci-scope.sh | \
            scripts/lib/production-baseline-classification.sh | \
            scripts/verify-production-baseline.sh | \
            scripts/publish-vercel-preview-checkpoint.sh | \
            scripts/quality-gate.sh | \
            scripts/eslint-github-formatter.mjs)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

mapfile -t CHANGED_FILES < <(
    git diff --name-only --diff-filter=ACMRD "${BASE_REF}" "${HEAD_REF}" |
        awk 'NF' |
        sort -u
)

maintenance_only=true
preview_required=false
if (("${#CHANGED_FILES[@]}" == 0)); then
    # No diff is unusual in CI. Prefer the safe/full path rather than skipping work.
    maintenance_only=false
    preview_required=true
else
    for file in "${CHANGED_FILES[@]}"; do
        if ! is_maintenance_only_path "${file}"; then
            maintenance_only=false
        fi
        if ! is_preview_safe_path "${file}"; then
            preview_required=true
        fi
    done
fi

if [[ "${maintenance_only}" == true ]]; then
    application=false
    sast=false
    build=false
else
    application=true
    sast=true
    build=true
fi

emit() {
    printf 'maintenance_only=%s\n' "${maintenance_only}"
    printf 'application=%s\n' "${application}"
    printf 'sast=%s\n' "${sast}"
    printf 'build=%s\n' "${build}"
    printf 'preview_required=%s\n' "${preview_required}"
    printf 'changed_count=%d\n' "${#CHANGED_FILES[@]}"
}

emit
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    emit >>"${GITHUB_OUTPUT}"
fi

if [[ "${maintenance_only}" == true ]]; then
    echo "ℹ️ CI scope: agent/quality maintenance only; application SAST/build may be skipped."
else
    echo "ℹ️ CI scope: application-capable change; full SAST/build remain mandatory."
fi
if [[ "${preview_required}" == true ]]; then
    echo "ℹ️ Preview scope: deploy-relevant change; Preview security gates are required."
else
    echo "ℹ️ Preview scope: no deploy-relevant changes; Preview runner may be skipped."
fi
