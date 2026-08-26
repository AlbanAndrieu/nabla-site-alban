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

if [[ -z "$base_sha" ]] || ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
  if git rev-parse HEAD^ >/dev/null 2>&1; then
    base_sha="$(git rev-parse HEAD^)"
    echo "VERCEL_GIT_PREVIOUS_SHA unavailable; falling back to parent commit $base_sha."
  else
    echo "No comparison base available; build deployment."
    exit 1
  fi
fi

changed_files="$(git diff --name-only "$base_sha" HEAD)"

if [[ -z "$changed_files" ]]; then
  echo "No changed files detected since $base_sha; skip deployment."
  exit 0
fi

echo "Changed files since $base_sha:"
printf '%s\n' "$changed_files"

while IFS= read -r file; do
  case "$file" in
    docs/*|*.md|unit-tests/*|.github/*|.github/**/*|.vscode/*|.idea/*)
      ;;
    *)
      echo "Deploy-relevant change detected: $file"
      exit 1
      ;;
  esac
done <<< "$changed_files"

echo "Only documentation, tests, editor metadata, or GitHub maintenance changed; skip Vercel deployment."
exit 0
