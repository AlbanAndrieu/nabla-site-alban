#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

BASE_SHA="${BASE_SHA:-${QUALITY_BASE_REF:-}}"
GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
API_URL="${GITHUB_API_URL:-https://api.github.com}"
REPOSITORY="${GITHUB_REPOSITORY:-}"
MAX_RELEASE_HOPS="${QUALITY_BASELINE_RELEASE_HOPS:-3}"
MAX_MAINTENANCE_HOPS="${QUALITY_BASELINE_MAINTENANCE_HOPS:-5}"

production_contexts=(
    "Production Post-deploy Smoke"
    "Production DAST"
)
required_contexts=(
    "Vercel"
    "${production_contexts[@]}"
)

if [[ ! "${BASE_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
    printf '❌ PROD_BASE_INVALID: BASE_SHA must be a 40-character commit SHA, got %s\n' "${BASE_SHA:-<empty>}" >&2
    exit 2
fi
if [[ -z "${GH_TOKEN}" ]]; then
    echo "❌ PROD_BASE_TOKEN_MISSING: GH_TOKEN/GITHUB_TOKEN is required" >&2
    exit 2
fi
if [[ ! "${REPOSITORY}" =~ ^[^/]+/[^/]+$ ]]; then
    printf '❌ PROD_BASE_REPOSITORY_INVALID: GITHUB_REPOSITORY must be owner/name, got %s\n' "${REPOSITORY:-<empty>}" >&2
    exit 2
fi
if [[ ! "${MAX_RELEASE_HOPS}" =~ ^[0-9]+$ ]]; then
    printf '❌ QUALITY_BASELINE_RELEASE_HOPS must be a non-negative integer, got %s\n' "${MAX_RELEASE_HOPS}" >&2
    exit 2
fi
if [[ ! "${MAX_MAINTENANCE_HOPS}" =~ ^[0-9]+$ ]]; then
    printf '❌ QUALITY_BASELINE_MAINTENANCE_HOPS must be a non-negative integer, got %s\n' "${MAX_MAINTENANCE_HOPS}" >&2
    exit 2
fi

status_json() {
    local sha="$1"
    curl --fail-with-body --silent --show-error \
        --header "Authorization: Bearer ${GH_TOKEN}" \
        --header 'Accept: application/vnd.github+json' \
        --header 'X-GitHub-Api-Version: 2022-11-28' \
        "${API_URL}/repos/${REPOSITORY}/commits/${sha}/status?per_page=100"
}

latest_status() {
    local json="$1"
    local context="$2"
    jq -c --arg context "${context}" \
        '([.statuses[]? | select(.context == $context)] | sort_by(.created_at) | last) // {}' \
        <<<"${json}"
}

# shellcheck source=scripts/lib/production-baseline-classification.sh
source scripts/lib/production-baseline-classification.sh

candidate="${BASE_SHA}"
release_hops=0
maintenance_hops=0

while :; do
    if ! json="$(status_json "${candidate}")"; then
        printf '❌ PROD_BASE_STATUS_API: failed to fetch commit statuses for %s\n' "${candidate}" >&2
        exit 2
    fi
    if ! jq -e '.statuses | type == "array"' >/dev/null 2>&1 <<<"${json}"; then
        printf '❌ PROD_BASE_STATUS_JSON: invalid commit status payload for %s\n' "${candidate}" >&2
        exit 2
    fi

    missing=()
    production_missing=()
    failed=()
    vercel_state="missing"

    for context in "${required_contexts[@]}"; do
        status="$(latest_status "${json}" "${context}")"
        state="$(jq -r '.state // "missing"' <<<"${status}")"
        description="$(jq -r '.description // ""' <<<"${status}")"
        if [[ "${context}" == "Vercel" ]]; then
            vercel_state="${state}"
        fi

        case "${state}" in
            success)
                printf '✅ %s @ %s: %s\n' "${context}" "${candidate}" "${description:-success}"
                ;;
            missing)
                missing+=("${context}")
                if [[ "${context}" != "Vercel" ]]; then
                    production_missing+=("${context}")
                fi
                ;;
            *)
                failed+=("${context}=${state}")
                ;;
        esac
    done

    if (("${#failed[@]}" > 0)); then
        printf '❌ PROD_BASE_UNHEALTHY: %s has non-success production status(es): %s\n' \
            "${candidate}" "${failed[*]}" >&2
        exit 1
    fi

    if (("${#missing[@]}" == 0)); then
        printf '✅ production baseline healthy at %s\n' "${candidate}"
        if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
            printf 'baseline_sha=%s\nrelease_hops=%d\nmaintenance_hops=%d\n' \
                "${candidate}" "${release_hops}" "${maintenance_hops}" >>"${GITHUB_OUTPUT}"
        fi
        if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
            {
                echo "## Production baseline"
                echo
                echo "- PR base: \`${BASE_SHA}\`"
                echo "- healthy production baseline: \`${candidate}\`"
                echo "- semantic-release metadata hops: ${release_hops}"
                echo "- maintenance-only hops: ${maintenance_hops}"
                echo "- required statuses: Vercel, Production Post-deploy Smoke, Production DAST"
            } >>"${GITHUB_STEP_SUMMARY}"
        fi
        exit 0
    fi

    if [[ "${vercel_state}" == "success" ]] && (("${#production_missing[@]}" > 0 && "${#production_missing[@]}" != "${#production_contexts[@]}")); then
        printf '❌ PROD_BASE_PARTIAL: %s has an inconsistent partial production status set; missing: %s\n' \
            "${candidate}" "${production_missing[*]}" >&2
        exit 1
    fi

    if [[ "${vercel_state}" != "success" ]]; then
        printf '❌ PROD_BASE_MISSING: %s is missing %s and Vercel is not successful\n' \
            "${candidate}" "${missing[*]}" >&2
        exit 1
    fi

    parent="$(git rev-parse "${candidate}^")"
    if release_only_hop "${parent}" "${candidate}"; then
        if ((release_hops >= MAX_RELEASE_HOPS)); then
            printf '❌ PROD_BASE_MISSING: %s exceeds the semantic-release metadata hop budget %s while missing: %s\n' \
                "${candidate}" "${MAX_RELEASE_HOPS}" "${missing[*]}" >&2
            exit 1
        fi
        printf 'ℹ️  Vercel is successful but production-only statuses are absent on metadata-only release %s; inheriting the parent production baseline\n' "${candidate}"
        candidate="${parent}"
        release_hops=$((release_hops + 1))
        continue
    fi

    if maintenance_only_hop "${parent}" "${candidate}"; then
        if ((maintenance_hops >= MAX_MAINTENANCE_HOPS)); then
            printf '❌ PROD_BASE_MAINTENANCE_HOPS: %s exceeds the maintenance-only hop budget %s while missing: %s\n' \
                "${candidate}" "${MAX_MAINTENANCE_HOPS}" "${missing[*]}" >&2
            exit 1
        fi
        printf 'ℹ️  Vercel is successful but production-only statuses are absent on maintenance-only commit %s; inheriting the parent production baseline\n' "${candidate}"
        candidate="${parent}"
        maintenance_hops=$((maintenance_hops + 1))
        continue
    fi

    printf '❌ PROD_BASE_RELEASE_SCOPE: cannot inherit an older production baseline across %s\n' "${candidate}" >&2
    exit 1
done
