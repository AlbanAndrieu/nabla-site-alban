#!/usr/bin/env bash
set -euo pipefail

# L1-only offline check aligned with nabla-site-bababou. Never proof of publication.
root="$(git rev-parse --show-toplevel)"
cd "$root"
limit="${AGENT_OFFLINE_MAX_PATHS:-0}"
[[ "$limit" =~ ^(0|[1-9][0-9]*)$ ]] || {
    echo "OFFLINE_LIMIT_INVALID: expected a non-negative integer" >&2
    exit 2
}
base="${QUALITY_BASE_REF:-}"
if [[ -z "$base" ]]; then
    for candidate in origin/master origin/main master main; do
        if git rev-parse --verify "$candidate^{commit}" >/dev/null 2>&1; then
            base="$candidate"
            break
        fi
    done
fi
scope="$(mktemp)"
trap 'rm -f "$scope"' EXIT
base_ok=false
if [[ -n "$base" ]] && git rev-parse --verify "$base^{commit}" >/dev/null 2>&1 &&
    git merge-base "$base" HEAD >/dev/null 2>&1; then
    base_ok=true
fi
if [[ "$base_ok" == true ]]; then
    {
        git diff --name-only --diff-filter=ACMR "$base...HEAD"
        git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } | LC_ALL=C sort -u >"$scope"
else
    echo "OFFLINE_BASE_UNAVAILABLE: full local file scope, not PR completeness" >&2
    {
        git ls-files
        git ls-files --others --exclude-standard
    } | LC_ALL=C sort -u >"$scope"
fi
mapfile -t files <"$scope"
if ((limit > 0 && ${#files[@]} > limit)); then
    printf 'OFFLINE_LIMIT_EXCEEDED: %d paths > %d\n' "${#files[@]}" "$limit" >&2
    exit 2
fi
checked=0
for file in "${files[@]}"; do
    [[ -f "$file" && ! -L "$file" ]] || continue
    case "$file" in
        *.sh)
            bash -n "$file"
            checked=$((checked + 1))
            ;;
        *.py)
            python3 -c 'import ast,sys; from pathlib import Path; ast.parse(Path(sys.argv[1]).read_text(encoding="utf-8"), filename=sys.argv[1])' "$file"
            checked=$((checked + 1))
            ;;
    esac
done
if [[ "$base_ok" == true ]]; then git diff --check "$base...HEAD"; fi
git diff --check
git diff --cached --check
printf 'OFFLINE_L1_PASS paths=%d syntax_checked=%d\n' "${#files[@]}" "$checked"
echo "NOT_RUN: hooks, JS/TS lint, tests, build, security scans and publication"
