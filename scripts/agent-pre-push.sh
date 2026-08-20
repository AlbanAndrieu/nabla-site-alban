#!/usr/bin/env bash
set -euo pipefail

printf '\n🔧 Agent pre-push quality gate\n'

if ! command -v pre-commit >/dev/null 2>&1; then
  echo "❌ pre-commit is required. Install it before pushing."
  exit 1
fi

echo "🧹 Running Biome safe fixes..."
npx --no-install biome check --write .

echo "🔍 Running all pre-commit rules..."
pre-commit run --all-files

echo "🧪 Running TypeScript and unit tests..."
npm run typecheck
npm run test:unit

echo "🔎 Checking whitespace and patch integrity..."
git diff --check

echo "🧹 Re-running pre-commit after automatic fixes..."
pre-commit run --all-files

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Quality tools changed tracked files. Review and commit the fixes before pushing:"
  git status --short
  exit 1
fi

echo "✅ Agent pre-push quality gate passed."
