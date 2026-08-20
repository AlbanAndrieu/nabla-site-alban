#!/usr/bin/env bash
set -euo pipefail

# Vercel's Ignored Build Step uses an inverted exit convention:
#   0 => skip the deployment
#   1 => continue building
#
# Skip only when every changed file is maintenance/documentation that cannot
# affect the deployed application. Keep the allow-list deliberately narrow.

if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "No parent commit available; build deployment."
  exit 1
fi

changed_files="$(git diff --name-only HEAD^ HEAD)"

if [[ -z "$changed_files" ]]; then
  echo "No changed files detected; skip deployment."
  exit 0
fi

echo "Changed files:"
printf '%s\n' "$changed_files"

while IFS= read -r file; do
  case "$file" in
    docs/*|*.md|.github/ISSUE_TEMPLATE/*|.github/PULL_REQUEST_TEMPLATE.md)
      ;;
    .github/workflows/*)
      ;;
    *)
      echo "Deploy-relevant change detected: $file"
      exit 1
      ;;
  esac
done <<< "$changed_files"

echo "Only documentation/GitHub maintenance changed; skip Vercel deployment."
exit 0
