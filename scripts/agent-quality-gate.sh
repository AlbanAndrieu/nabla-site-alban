#!/usr/bin/env bash
set -euo pipefail

# Repository-specific agent-first pre-build gate.
# The canonical scripts/quality-gate.sh stays focused on changed-file
# formatter/linter/security checks; this wrapper adds Site Alban preflight checks.

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

MODE="check"
PUBLISH=false
case "${1:-}" in
    --fix)
        MODE="fix"
        shift
        ;;
    --publish)
        PUBLISH=true
        shift
        ;;
    -h | --help)
        cat <<'EOF'
Usage:
    bash scripts/agent-quality-gate.sh [--fix|--publish]

Modes:
    default    strict deterministic pre-build validation
    --fix      converge deterministic pre-commit + npm lint auto-fixes locally
    --publish  strict gate plus clean-tree publication validation

Environment:
    QUALITY_BASE_REF                    override comparison base
    QUALITY_LOG_TAIL                    failure log lines to print (default: 40)
    QUALITY_FIX_PASSES                  maximum local pre-commit fix passes (default: 12)
    QUALITY_CANONICAL_GATE_VERIFIED=1   CI-only: canonical gate already passed in this job
    QUALITY_ALLOW_LARGE_DELETION=1      acknowledge an intentional large truncation
EOF
        exit 0
        ;;
    "")
        ;;
    *)
        printf '❌ unknown argument: %s\n' "$1" >&2
        exit 2
        ;;
esac

if (($# > 0)); then
    printf '❌ unexpected argument: %s\n' "$1" >&2
    exit 2
fi

LOG_TAIL="${QUALITY_LOG_TAIL:-40}"
FIX_PASSES="${QUALITY_FIX_PASSES:-12}"
if [[ ! "${FIX_PASSES}" =~ ^[1-9][0-9]*$ ]]; then
    echo "❌ QUALITY_FIX_PASSES must be a positive integer" >&2
    exit 2
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

run_compact() {
    local label="$1"
    shift
    local log
    local rc
    log="$(mktemp)"
    if "$@" >"${log}" 2>&1; then
        rm -f "${log}"
        printf '✅ %s\n' "${label}"
        return 0
    else
        rc=$?
    fi
    printf '❌ %s\n' "${label}" >&2
    tail -n "${LOG_TAIL}" "${log}" >&2 || true
    rm -f "${log}"
    return "${rc}"
}

run_compact_report() {
    local label="$1"
    shift
    local log
    local rc
    log="$(mktemp)"
    if "$@" >"${log}" 2>&1; then
        grep -E '^(WARNING |Code-size gate:)' "${log}" || true
        rm -f "${log}"
        printf '✅ %s\n' "${label}"
        return 0
    else
        rc=$?
    fi
    printf '❌ %s\n' "${label}" >&2
    tail -n "${LOG_TAIL}" "${log}" >&2 || true
    rm -f "${log}"
    return "${rc}"
}

collect_changed_files() {
    {
        if [[ "${BASE_REF}" != "HEAD" ]] && git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
            git diff --name-only --diff-filter=ACMR "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=ACMR
        git diff --cached --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } |
        awk 'NF' |
        sort -u |
        while IFS= read -r file; do
            [[ -f "${file}" ]] && printf '%s\n' "${file}"
        done
}

collect_deleted_files() {
    {
        if [[ "${BASE_REF}" != "HEAD" ]] && git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
            git diff --name-only --diff-filter=D "${BASE_REF}...HEAD"
        fi
        git diff --name-only --diff-filter=D
        git diff --cached --name-only --diff-filter=D
    } |
        awk 'NF' |
        sort -u
}

workspace_fingerprint() {
    local file
    {
        git diff --binary
        git diff --cached --binary
        git status --porcelain=v1 --untracked-files=all
        while IFS= read -r file; do
            [[ -f "${file}" ]] || continue
            printf 'file:%s\n' "${file}"
            sha256sum "${file}"
        done < <(collect_changed_files)
    } | sha256sum | awk '{print $1}'
}

precommit_fix_until_stable() {
    local pass
    local before
    local after
    local log
    local rc

    for ((pass = 1; pass <= FIX_PASSES; pass++)); do
        mapfile -t fix_files < <(collect_changed_files)
        if (("${#fix_files[@]}" == 0)); then
            echo "✅ no changed files require pre-commit auto-fixes"
            return 0
        fi

        before="$(workspace_fingerprint)"
        log="$(mktemp)"
        set +e
        pre-commit run --hook-stage pre-commit --files "${fix_files[@]}" >"${log}" 2>&1
        rc=$?
        set -e
        after="$(workspace_fingerprint)"

        if ((rc == 0)); then
            rm -f "${log}"
            printf '✅ pre-commit auto-fix converged after pass %d\n' "${pass}"
            return 0
        fi

        if [[ "${before}" != "${after}" ]]; then
            printf '🔧 pre-commit pass %d/%d applied deterministic fixes; retrying without log analysis\n' \
                "${pass}" "${FIX_PASSES}"
            rm -f "${log}"
            continue
        fi

        echo "❌ QG_PRECOMMIT_FAILED: auto-fix made no further progress." >&2
        tail -n "${LOG_TAIL}" "${log}" >&2 || true
        rm -f "${log}"
        return "${rc}"
    done

    echo "❌ QG_FIX_DID_NOT_CONVERGE: pre-commit kept changing files after ${FIX_PASSES} passes." >&2
    echo "   Inspect 'git status --short' and only the relevant changed files." >&2
    git status --short >&2
    return 1
}

mapfile -t CHANGED_FILES < <(collect_changed_files)
mapfile -t DELETED_FILES < <(collect_deleted_files)

command -v pre-commit >/dev/null 2>&1 || {
    echo "❌ pre-commit is required; run 'mise run hooks' or install the agent bootstrap dependencies" >&2
    exit 1
}

agent_gate_changed=false
javascript_lint_all=false
stylelint_all=false
JAVASCRIPT_LINT_FILES=()
STYLELINT_FILES=()
for file in "${CHANGED_FILES[@]}"; do
    case "${file}" in
        scripts/agent-quality-gate.sh)
            agent_gate_changed=true
            ;;
    esac
    case "${file}" in
        eslint.config.js)
            javascript_lint_all=true
            ;;
        *.js | *.jsx | *.mjs | *.cjs | *.ts | *.tsx)
            JAVASCRIPT_LINT_FILES+=("${file}")
            ;;
    esac
    case "${file}" in
        stylelint.config.cjs)
            stylelint_all=true
            ;;
        *.css)
            STYLELINT_FILES+=("${file}")
            ;;
    esac
done

if [[ "${MODE}" != "fix" && "${agent_gate_changed}" == true && "${QUALITY_CANONICAL_GATE_VERIFIED:-0}" != "1" ]]; then
    run_compact "agent gate shell formatting" \
        pre-commit run shfmt-docker --files scripts/agent-quality-gate.sh
    run_compact "agent gate shell lint" \
        pre-commit run shell-lint --files scripts/agent-quality-gate.sh
    run_compact "agent gate shell style" \
        pre-commit run bashate --files scripts/agent-quality-gate.sh
fi

if [[ "${MODE}" == "fix" ]]; then
    precommit_fix_until_stable

    if [[ "${javascript_lint_all}" == true || "${stylelint_all}" == true || "${#JAVASCRIPT_LINT_FILES[@]}" -gt 0 || "${#STYLELINT_FILES[@]}" -gt 0 ]]; then
        if command -v npm >/dev/null 2>&1 && [[ -d node_modules ]]; then
            if [[ "${javascript_lint_all}" == true ]]; then
                run_compact "ESLint local auto-fix" npm run lint:fix
            elif (("${#JAVASCRIPT_LINT_FILES[@]}" > 0)); then
                run_compact "ESLint changed-file auto-fix" \
                    npx eslint --fix --format ./scripts/eslint-github-formatter.mjs "${JAVASCRIPT_LINT_FILES[@]}"
            fi
            if [[ "${stylelint_all}" == true ]]; then
                run_compact "Stylelint local auto-fix" npm run lint:css:fix
            elif (("${#STYLELINT_FILES[@]}" > 0)); then
                run_compact "Stylelint changed-file auto-fix" \
                    npx stylelint --fix "${STYLELINT_FILES[@]}"
            fi
            # npm lint auto-fixes may change files covered by Biome/other hooks.
            precommit_fix_until_stable
        else
            echo "⚠️ QG_NODE_FIX_SKIPPED: node_modules unavailable; pre-commit fixes ran, but npm lint auto-fixes were skipped." >&2
            echo "   Run 'npm ci --no-audit --no-fund' before the strict publication gate." >&2
        fi
    fi

    echo "✅ deterministic local auto-fix phase converged."
    git status --short
    echo "ℹ️ review the short diff, commit the result, then let the pre-push publication gate validate it."
    exit 0
fi

if [[ "${BASE_REF}" != "HEAD" ]]; then
    if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
        printf '❌ QG_BASE_MISSING: comparison base %s is unavailable\n' "${BASE_REF}" >&2
        exit 1
    fi
    if ! git merge-base --is-ancestor "${BASE_REF}" HEAD; then
        printf '❌ QG_BASE_STALE: HEAD does not contain %s; fetch/rebase before publishing\n' "${BASE_REF}" >&2
        exit 1
    fi
    printf '✅ branch contains comparison base %s\n' "${BASE_REF}"
fi

large_deletion_failed=0
if [[ "${QUALITY_ALLOW_LARGE_DELETION:-0}" != "1" && "${BASE_REF}" != "HEAD" ]]; then
    for file in "${CHANGED_FILES[@]}"; do
        case "${file}" in
            package-lock.json | public/assets/fontawesome-free-7.1.0-web/* | public/assets/fontawesome/*)
                continue
                ;;
            # Reviewed P1 module splits: these facades intentionally shrink below
            # the destructive-diff threshold while behavior moves to cohesive
            # modules. Once merged, their new <200-line baselines make this inert.
            lib/homelabHealth.ts | lib/homelabObservability.ts)
                continue
                ;;
            *.md | *.ts | *.tsx | *.js | *.mjs | *.cjs | *.css | *.scss | *.html | *.json | *.yml | *.yaml | *.toml | *.py | *.sh | Dockerfile* | Makefile)
                ;;
            *)
                continue
                ;;
        esac
        git cat-file -e "${BASE_REF}:${file}" 2>/dev/null || continue
        base_lines="$(git show "${BASE_REF}:${file}" | wc -l | tr -d ' ')"
        current_lines="$(wc -l <"${file}" | tr -d ' ')"
        if ((base_lines < 200 || current_lines >= base_lines)); then
            continue
        fi
        deleted_lines=$((base_lines - current_lines))
        deleted_percent=$((deleted_lines * 100 / base_lines))
        if ((deleted_lines >= 100 && deleted_percent >= 40)); then
            printf '❌ QG_LARGE_DELETION: %s lost %d/%d lines (%d%%); set QUALITY_ALLOW_LARGE_DELETION=1 only after explicit review\n' \
                "${file}" "${deleted_lines}" "${base_lines}" "${deleted_percent}" >&2
            large_deletion_failed=1
        fi
    done

    for file in "${DELETED_FILES[@]}"; do
        case "${file}" in
            package-lock.json | public/assets/fontawesome-free-7.1.0-web/* | public/assets/fontawesome/*)
                continue
                ;;
            # Reviewed dead-code retirements and temporary-module removals. These
            # paths are absent after this change, so they cannot mask future edits.
            app/\[locale\]/architecture/ArchitectureExplorer.tsx | \
                app/\[locale\]/architecture/ArchitectureExplorer.module.css | \
                app/components/truenas/HomeLabNetworkFlow.module.css | \
                lib/homelabHealthBase.ts | \
                lib/resourcePages.ts)
                continue
                ;;
            *.md | *.ts | *.tsx | *.js | *.mjs | *.cjs | *.css | *.scss | *.html | *.json | *.yml | *.yaml | *.toml | *.py | *.sh | Dockerfile* | Makefile)
                ;;
            *)
                continue
                ;;
        esac
        git cat-file -e "${BASE_REF}:${file}" 2>/dev/null || continue
        base_lines="$(git show "${BASE_REF}:${file}" | wc -l | tr -d ' ')"
        if ((base_lines >= 200)); then
            printf '❌ QG_LARGE_DELETION: %s was deleted (%d lines); set QUALITY_ALLOW_LARGE_DELETION=1 only after explicit review\n' \
                "${file}" "${base_lines}" >&2
            large_deletion_failed=1
        fi
    done
fi
if ((large_deletion_failed != 0)); then
    exit 1
fi
printf '✅ destructive-diff guard\n'

exec_bit_failed=0
for file in "${CHANGED_FILES[@]}"; do
    IFS= read -r first_line <"${file}" || true
    [[ "${first_line:-}" == '#!'* ]] || continue

    if git ls-files --error-unmatch -- "${file}" >/dev/null 2>&1; then
        mode="$(git ls-files --stage -- "${file}" | awk 'NR == 1 {print $1}')"
        if [[ "${mode}" != "100755" ]]; then
            printf '❌ QG_EXEC_BIT: %s has a shebang but Git mode is %s; run git add --chmod=+x %q\n' \
                "${file}" "${mode:-unknown}" "${file}" >&2
            exec_bit_failed=1
        fi
    elif [[ ! -x "${file}" ]]; then
        printf '❌ QG_EXEC_BIT: untracked %s has a shebang but is not executable\n' "${file}" >&2
        exec_bit_failed=1
    fi
done
if ((exec_bit_failed != 0)); then
    exit 1
fi
printf '✅ executable-script contract\n'

if (("${#CHANGED_FILES[@]}" > 0)); then
    run_compact_report "baseline-aware code-size report" \
        python3 scripts/check_code_size.py \
        --baseline-ref "${BASE_REF}" \
        "${CHANGED_FILES[@]}"
else
    echo "✅ baseline-aware code-size report (no changed files)"
fi

command -v npm >/dev/null 2>&1 || {
    echo "❌ npm is required" >&2
    exit 1
}
if [[ ! -d node_modules ]]; then
    echo "❌ JavaScript dependencies are missing; run 'npm ci --no-audit --no-fund' first" >&2
    exit 1
fi

if [[ "${PUBLISH}" == true ]]; then
    run_compact "canonical formatter/linter/security publication gate" \
        bash scripts/quality-gate.sh --publish
elif [[ "${QUALITY_CANONICAL_GATE_VERIFIED:-0}" == "1" ]]; then
    echo "✅ canonical formatter/linter/security gate already verified earlier in this CI job"
else
    run_compact "canonical formatter/linter/security gate" \
        bash scripts/quality-gate.sh
fi

run_compact "ESLint" npm run lint
run_compact "Stylelint" npm run lint:css
run_compact "Next.js route type generation" npx next typegen
run_compact "TypeScript" npm run typecheck
run_compact "unit and contract tests" npm run test:unit

if [[ "${PUBLISH}" == true ]]; then
    STATUS="$(git status --short)"
    if [[ -n "${STATUS}" ]]; then
        echo "❌ Working tree changed during the agent publication gate." >&2
        printf '%s\n' "${STATUS}" >&2
        exit 1
    fi
    echo "✅ Agent publication gate passed; repository is clean and safe to publish."
else
    echo "✅ Agent pre-build quality gate passed."
fi
