#!/usr/bin/env bash
set -euo pipefail

# Canonical agent/human quality gate. Keep this file byte-for-byte identical
# across Nabla repositories so local publication policy cannot drift by project.

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

if ! command -v pre-commit >/dev/null 2>&1; then
  echo "❌ pre-commit is required. Run 'mise run hooks' first."
  exit 1
fi

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

if ((${#CHANGED_FILES[@]} > 0)); then
  echo "🔧 Running repository formatters and linters on changed files..."
  if ! pre-commit run \
    --hook-stage pre-commit \
    --files "${CHANGED_FILES[@]}" \
    --show-diff-on-failure; then
    echo "❌ Pre-commit changed files or found validation errors."
    echo "   Review/fix the output, then run scripts/quality-gate.sh again."
    git status --short
    exit 1
  fi
else
  echo "✅ No changed files require formatter/linter validation."
fi

echo "🔍 Checking whitespace errors..."
git diff --check
git diff --cached --check

STATUS="$(git status --short)"
if [[ -n "${STATUS}" ]]; then
  echo "❌ Working tree is not clean after quality validation."
  echo "   Review and commit generated/fixed files, then run scripts/quality-gate.sh again."
  printf '%s\n' "${STATUS}"
  exit 1
fi

echo "✅ Quality gate passed; repository is clean and ready to publish."
