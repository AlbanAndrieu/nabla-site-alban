#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'USAGE'
Usage:
  bash scripts/publish-vercel-preview-checkpoint.sh <checkpoint-branch> <base-sha> [head-sha]

Publishes an exact-SHA Vercel checkpoint branch without weakening any quality
or security gate. New checkpoint refs are seeded at the PR base first so the
subsequent move emits the Git update used by the Vercel integration.

Environment:
  CHECKPOINT_REMOTE  Git remote to publish to (default: origin)
USAGE
}

CHECKPOINT_BRANCH="${1:-}"
BASE_REF="${2:-}"
HEAD_REF="${3:-HEAD}"
REMOTE="${CHECKPOINT_REMOTE:-origin}"

if [[ -z "${CHECKPOINT_BRANCH}" || -z "${BASE_REF}" ]]; then
    usage >&2
    exit 2
fi

if [[ ! "${CHECKPOINT_BRANCH}" =~ ^vercel-preview-pr-[0-9]+$ ]]; then
    printf '❌ invalid checkpoint branch: %s\n' "${CHECKPOINT_BRANCH}" >&2
    exit 2
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

if ! git remote get-url "${REMOTE}" >/dev/null 2>&1; then
    printf '❌ Git remote not found: %s\n' "${REMOTE}" >&2
    exit 2
fi

if ! base_sha="$(git rev-parse --verify "${BASE_REF}^{commit}" 2>/dev/null)"; then
    printf '❌ checkpoint base is not a commit: %s\n' "${BASE_REF}" >&2
    exit 2
fi
if ! head_sha="$(git rev-parse --verify "${HEAD_REF}^{commit}" 2>/dev/null)"; then
    printf '❌ checkpoint head is not a commit: %s\n' "${HEAD_REF}" >&2
    exit 2
fi
if ! git merge-base --is-ancestor "${base_sha}" "${head_sha}"; then
    printf '❌ checkpoint head %s does not contain base %s\n' "${head_sha}" "${base_sha}" >&2
    exit 1
fi

checkpoint_ref="refs/heads/${CHECKPOINT_BRANCH}"
remote_sha="$({ git ls-remote --exit-code --heads "${REMOTE}" "${checkpoint_ref}" || true; } | awk 'NR == 1 {print $1}')"

if [[ -z "${remote_sha}" ]]; then
    # Creating a new ref directly at the final SHA does not reliably emit the Git
    # update Vercel listens for. Seed at the PR base, then move to the exact head.
    git push "${REMOTE}" "${base_sha}:${checkpoint_ref}"
    remote_sha="${base_sha}"
fi

if [[ "${remote_sha}" == "${head_sha}" ]]; then
    printf '✅ %s already points to %s\n' "${CHECKPOINT_BRANCH}" "${head_sha}"
    exit 0
fi

git push \
    --force-with-lease="${checkpoint_ref}:${remote_sha}" \
    "${REMOTE}" \
    "${head_sha}:${checkpoint_ref}"

printf '✅ Published %s at %s\n' "${CHECKPOINT_BRANCH}" "${head_sha}"
