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
    --fix      apply/check pre-commit hooks on changed files
    --publish  strict gate plus clean-tree publication validation

Environment:
    QUALITY_BASE_REF                 override comparison base
    QUALITY_LOG_TAIL                 failure log lines to print (default: 80)
    QUALITY_ALLOW_LARGE_DELETION=1   acknowledge an intentional large truncation
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

LOG_TAIL="${QUALITY_LOG_TAIL:-80}"

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

mapfile -t CHANGED_FILES < <(collect_changed_files)
mapfile -t DELETED_FILES < <(collect_deleted_files)

command -v pre-commit >/dev/null 2>&1 || {
    echo "❌ pre-commit is required; run 'mise run hooks' or install the agent bootstrap dependencies" >&2
    exit 1
}

agent_gate_changed=false
for file in "${CHANGED_FILES[@]}"; do
    if [[ "${file}" == "scripts/agent-quality-gate.sh" ]]; then
        agent_gate_changed=true
        break
    fi
done

if [[ "${MODE}" != "fix" && "${agent_gate_changed}" == true ]]; then
    run_compact "agent gate shell formatting" \
        pre-commit run shfmt-docker --files scripts/agent-quality-gate.sh
    run_compact "agent gate shell lint" \
        pre-commit run shell-lint --files scripts/agent-quality-gate.sh
    run_compact "agent gate shell style" \
        pre-commit run bashate --files scripts/agent-quality-gate.sh
fi

if [[ "${MODE}" == "fix" ]]; then
    if (("${#CHANGED_FILES[@]}" > 0)); then
        run_compact "apply/check pre-commit hooks on changed files" \
            pre-commit run --hook-stage pre-commit \
            --files "${CHANGED_FILES[@]}" --show-diff-on-failure
    fi
    echo "ℹ️  review 'git diff' and 'git status --short', commit the result, then run this gate without --fix"
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
