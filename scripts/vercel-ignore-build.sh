#!/usr/bin/env bash
set -euo pipefail

# Vercel's Ignored Build Step uses an inverted exit convention:
#   0 => skip the deployment
#   1 => continue building
#
# Compare with the last successful Vercel deployment and skip changes that cannot
# affect the deployed application. Keep application/runtime configuration,
# dependencies, assets, messages and build scripts deploy-relevant.

base_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"
git_ref="${VERCEL_GIT_COMMIT_REF:-}"

# `vercel-preview-*` refs are explicit, CI-validated publication checkpoints.
# Always build them so the Vercel deployment and Playwright checkout refer to
# the exact validated PR SHA, even when the latest delta is test/docs-only.
if [[ "${git_ref}" == vercel-preview-* ]]; then
    echo "Validated checkpoint ${git_ref}; build exact deployment."
    exit 1
fi

if [[ -z "${base_sha}" ]] || ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
    # A previous build may have been skipped: HEAD^ then describes only a
    # documentation commit, not the application delta waiting for its first
    # Preview. Prefer the real branch merge base when Git provides it.
    if [[ -n "${git_ref}" && "${git_ref}" != "master" && "${git_ref}" != "main" ]] &&
        git rev-parse --verify refs/remotes/origin/master^{commit} >/dev/null 2>&1; then
        base_sha="$(git merge-base HEAD refs/remotes/origin/master || true)"
        if [[ -n "${base_sha}" && "${base_sha}" != "$(git rev-parse HEAD)" ]]; then
            echo "No prior deployed SHA; checking entire branch against master merge-base ${base_sha}."
        else
            echo "No reliable prior deployment or branch comparison; build safely."
            exit 1
        fi
    else
        # For a shallow Vercel clone, guessing HEAD^ is unsafe. Build rather
        # than skip application changes hidden behind tests/docs commits.
        echo "No verified previous deployment SHA or branch merge-base; build safely."
        exit 1
    fi
fi

if ! changed_files="$(git diff --name-only "${base_sha}" HEAD)"; then
    echo "Cannot compare HEAD with ${base_sha}; build deployment."
    exit 1
fi

if [[ -z "${changed_files}" ]]; then
    echo "No changed files detected since ${base_sha}; skip deployment."
    exit 0
fi

echo "Changed files since ${base_sha}:"
printf '%s\n' "${changed_files}"

while IFS= read -r file; do
    case "${file}" in
    docs/* | unit-tests/* | .github/**/* | .vscode/* | .idea/* | *.md)
        ;;
    *)
        echo "Deploy-relevant change detected: ${file}"
        exit 1
        ;;
    esac
done <<<"${changed_files}"

echo "Only documentation, tests, editor metadata, or GitHub maintenance changed; skip Vercel deployment."
exit 0
