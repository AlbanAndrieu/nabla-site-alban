#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
CONFIG="${ROOT}/.github/rulesets/master-quality.json"
API_VERSION="2026-03-10"
MODE="check"
REPOSITORY="${GITHUB_REPOSITORY:-}"

usage() {
    cat <<'EOF'
Usage: bash scripts/manage-master-ruleset.sh [--validate|--check|--apply|--print] [--repo OWNER/REPO]

Audits or applies the repository-owned default-branch ruleset. Applying requires
GitHub repository Administration:write permission. --check is read-only.
EOF
}

while (($# > 0)); do
    case "$1" in
        --validate)
            MODE="validate"
            ;;
        --check)
            MODE="check"
            ;;
        --apply)
            MODE="apply"
            ;;
        --print)
            MODE="print"
            ;;
        --repo)
            shift
            REPOSITORY="${1:-}"
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            printf 'RULESET_ARGUMENT_INVALID: %s\n' "$1" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

require_tool() {
    if ! command -v "$1" >/dev/null 2>&1; then
        printf 'RULESET_TOOL_MISSING: %s\n' "$1" >&2
        exit 2
    fi
}

require_tool jq

if [[ ! -f "${CONFIG}" ]]; then
    printf 'RULESET_CONFIG_MISSING: %s\n' "${CONFIG}" >&2
    exit 2
fi

validate_config() {
    jq -e '
        .name == "master-quality-and-pr-safety"
        and .target == "branch"
        and .enforcement == "active"
        and (.conditions.ref_name.include == ["~DEFAULT_BRANCH"])
        and (.conditions.ref_name.exclude == [])
        and ([.rules[].type] | sort == ["deletion", "non_fast_forward", "pull_request", "required_status_checks"])
        and ([.rules[] | select(.type == "pull_request") | .parameters] == [{
            "allowed_merge_methods":["merge","squash","rebase"],
            "dismiss_stale_reviews_on_push":false,
            "require_code_owner_review":false,
            "require_last_push_approval":false,
            "required_approving_review_count":0,
            "required_review_thread_resolution":false
        }])
        and ([.rules[] | select(.type == "required_status_checks") | .parameters.do_not_enforce_on_create] == [false])
        and ([.rules[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy] == [false])
        and ([.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[]] | sort_by(.context) == [
            {"context":"CI policy guard","integration_id":15368},
            {"context":"quality","integration_id":15368}
        ])
        and ([.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | index("Vercel") == null)
        and ([.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | index("Playwright Preview E2E") == null)
        and (.bypass_actors == [{"actor_id":7859836,"actor_type":"User","bypass_mode":"pull_request"}])
    ' "${CONFIG}" >/dev/null || {
        printf 'RULESET_CONFIG_INVALID: %s\n' "${CONFIG}" >&2
        exit 2
    }
}

validate_config

if [[ "${MODE}" == "validate" ]]; then
    printf 'RULESET_CONFIG_OK: %s\n' "${CONFIG}"
    exit 0
fi

if [[ "${MODE}" == "print" ]]; then
    jq -S . "${CONFIG}"
    exit 0
fi

require_tool gh

if [[ -z "${REPOSITORY}" ]]; then
    remote_url="$(git -C "${ROOT}" remote get-url origin 2>/dev/null || true)"
    REPOSITORY="$(sed -E -e 's#^(https://github.com/|git@github.com:)##' -e 's#\.git$##' <<<"${remote_url}")"
fi

if [[ ! "${REPOSITORY}" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
    printf 'RULESET_REPOSITORY_INVALID: %s\n' "${REPOSITORY:-<empty>}" >&2
    exit 2
fi

api() {
    gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: ${API_VERSION}" "$@"
}

rulesets_json="$(api --method GET "repos/${REPOSITORY}/rulesets?per_page=100")"
name="$(jq -r '.name' "${CONFIG}")"
matching_count="$(jq --arg name "${name}" '[.[] | select(.name == $name)] | length' <<<"${rulesets_json}")"

if [[ "${matching_count}" -gt 1 ]]; then
    printf 'RULESET_DUPLICATE: %s has %s rulesets named %s\n' "${REPOSITORY}" "${matching_count}" "${name}" >&2
    exit 3
fi

ruleset_id="$(jq -r --arg name "${name}" '.[] | select(.name == $name) | .id' <<<"${rulesets_json}")"

normalize_expected() {
    jq -S -c '{name,target,enforcement,bypass_actors,conditions,rules}' "${CONFIG}"
}

normalize_actual() {
    jq -S -c '{name,target,enforcement,bypass_actors,conditions,rules}'
}

check_exact() {
    local id="$1"
    local expected actual response
    expected="$(normalize_expected)"
    response="$(api --method GET "repos/${REPOSITORY}/rulesets/${id}")"
    actual="$(normalize_actual <<<"${response}")"
    if [[ "${actual}" != "${expected}" ]]; then
        printf 'RULESET_DRIFT: %s ruleset %s differs from repository config\n' "${REPOSITORY}" "${name}" >&2
        diff -u <(jq -S . "${CONFIG}") <(normalize_actual <<<"${response}" | jq -S .) >&2 || true
        return 1
    fi
    printf 'RULESET_OK: %s ruleset %s matches repository config\n' "${REPOSITORY}" "${name}"
}

if [[ "${MODE}" == "check" ]]; then
    if [[ -z "${ruleset_id}" ]]; then
        printf 'RULESET_MISSING: %s has no ruleset named %s\n' "${REPOSITORY}" "${name}" >&2
        exit 3
    fi
    check_exact "${ruleset_id}"
    exit 0
fi

if [[ -z "${ruleset_id}" ]]; then
    printf 'RULESET_CREATE: %s -> %s\n' "${name}" "${REPOSITORY}"
    api --method POST "repos/${REPOSITORY}/rulesets" --input "${CONFIG}" >/dev/null
    rulesets_json="$(api --method GET "repos/${REPOSITORY}/rulesets?per_page=100")"
    ruleset_id="$(jq -r --arg name "${name}" '.[] | select(.name == $name) | .id' <<<"${rulesets_json}")"
else
    printf 'RULESET_UPDATE: %s #%s on %s\n' "${name}" "${ruleset_id}" "${REPOSITORY}"
    api --method PUT "repos/${REPOSITORY}/rulesets/${ruleset_id}" --input "${CONFIG}" >/dev/null
fi

if [[ -z "${ruleset_id}" ]]; then
    printf 'RULESET_APPLY_FAILED: GitHub did not return the configured ruleset\n' >&2
    exit 4
fi

check_exact "${ruleset_id}"
