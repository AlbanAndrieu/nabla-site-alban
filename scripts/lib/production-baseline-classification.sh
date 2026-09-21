# shellcheck shell=bash
# Classification helpers for scripts/verify-production-baseline.sh.
# This file is sourced; it intentionally has no shebang and is not executable.

stable_semver_gt() {
    local parent_version="$1"
    local child_version="$2"
    local parent_major parent_minor parent_patch
    local child_major child_minor child_patch

    IFS=. read -r parent_major parent_minor parent_patch <<<"${parent_version}"
    IFS=. read -r child_major child_minor child_patch <<<"${child_version}"

    if ((10#${child_major} != 10#${parent_major})); then
        ((10#${child_major} > 10#${parent_major}))
        return
    fi
    if ((10#${child_minor} != 10#${parent_minor})); then
        ((10#${child_minor} > 10#${parent_minor}))
        return
    fi
    ((10#${child_patch} > 10#${parent_patch}))
}

release_only_hop() {
    local parent="$1"
    local child="$2"
    local message
    local subject
    local file
    local package_changed=false
    local lock_changed=false
    local changelog_changed=false
    local normalized_filter
    local parent_package_version
    local child_package_version
    local parent_lock_version
    local child_lock_version
    local parent_lock_root_version
    local child_lock_root_version
    local parent_count

    message="$(git log -1 --format=%B "${child}")"
    subject="${message%%$'\n'*}"
    if [[ "${subject}" != chore\(release\):* ]] || ! grep -Fq '[skip ci]' <<<"${message}"; then
        return 1
    fi

    parent_count="$(git rev-list --parents -n 1 "${child}" | awk '{print NF - 1}')"
    if [[ "${parent_count}" != "1" ]]; then
        printf '❌ PROD_BASE_RELEASE_GRAPH: release %s has %s parents; baseline inheritance requires a linear single-parent release commit\n' \
            "${child}" "${parent_count}" >&2
        return 1
    fi

    mapfile -t release_files < <(git diff --name-only --diff-filter=ACMRD "${parent}" "${child}" | awk 'NF' | sort -u)
    if (("${#release_files[@]}" == 0)); then
        return 1
    fi

    for file in "${release_files[@]}"; do
        case "${file}" in
            CHANGELOG.md)
                changelog_changed=true
                ;;
            package.json)
                package_changed=true
                ;;
            package-lock.json)
                lock_changed=true
                ;;
            *)
                printf '❌ PROD_BASE_RELEASE_SCOPE: %s changes unexpected file %s\n' "${child}" "${file}" >&2
                return 1
                ;;
        esac
    done

    if [[ "${package_changed}" != true || "${lock_changed}" != true ]]; then
        printf '❌ PROD_BASE_RELEASE_SCOPE: %s does not contain the expected package version pair\n' "${child}" >&2
        return 1
    fi

    if ! cmp -s \
        <(git show "${parent}:package.json" | jq -S 'del(.version)') \
        <(git show "${child}:package.json" | jq -S 'del(.version)'); then
        printf '❌ PROD_BASE_RELEASE_SCOPE: package.json changed beyond version metadata in %s\n' "${child}" >&2
        return 1
    fi

    normalized_filter='del(.version) | if ((.packages // {}) | has("")) then .packages[""] |= del(.version) else . end'
    if ! cmp -s \
        <(git show "${parent}:package-lock.json" | jq -S "${normalized_filter}") \
        <(git show "${child}:package-lock.json" | jq -S "${normalized_filter}"); then
        printf '❌ PROD_BASE_RELEASE_SCOPE: package-lock.json changed beyond root version metadata in %s\n' "${child}" >&2
        return 1
    fi

    parent_package_version="$(git show "${parent}:package.json" | jq -er '.version | select(type == "string" and length > 0)')"
    child_package_version="$(git show "${child}:package.json" | jq -er '.version | select(type == "string" and length > 0)')"
    parent_lock_version="$(git show "${parent}:package-lock.json" | jq -er '.version | select(type == "string" and length > 0)')"
    child_lock_version="$(git show "${child}:package-lock.json" | jq -er '.version | select(type == "string" and length > 0)')"
    parent_lock_root_version="$(git show "${parent}:package-lock.json" | jq -er '.packages[""].version | select(type == "string" and length > 0)')"
    child_lock_root_version="$(git show "${child}:package-lock.json" | jq -er '.packages[""].version | select(type == "string" and length > 0)')"

    if ! [[ "${parent_package_version}" == "${parent_lock_version}" && "${parent_package_version}" == "${parent_lock_root_version}" ]]; then
        printf '❌ PROD_BASE_RELEASE_VERSION: parent %s has inconsistent package/lock versions\n' "${parent}" >&2
        return 1
    fi
    if ! [[ "${child_package_version}" == "${child_lock_version}" && "${child_package_version}" == "${child_lock_root_version}" ]]; then
        printf '❌ PROD_BASE_RELEASE_VERSION: release %s has inconsistent package/lock versions\n' "${child}" >&2
        return 1
    fi
    if [[ ! "${parent_package_version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ || ! "${child_package_version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        printf '❌ PROD_BASE_RELEASE_VERSION: production release hop must use stable numeric SemVer, got %s -> %s\n' \
            "${parent_package_version}" "${child_package_version}" >&2
        return 1
    fi
    if ! stable_semver_gt "${parent_package_version}" "${child_package_version}"; then
        printf '❌ PROD_BASE_RELEASE_VERSION: release %s does not monotonically advance package version %s -> %s\n' \
            "${child}" "${parent_package_version}" "${child_package_version}" >&2
        return 1
    fi
    if [[ "${subject}" != "chore(release): ${child_package_version} [skip ci]" ]]; then
        printf '❌ PROD_BASE_RELEASE_VERSION: release subject does not match package version %s in %s\n' \
            "${child_package_version}" "${child}" >&2
        return 1
    fi

    if [[ "${changelog_changed}" == true ]]; then
        printf 'ℹ️  accepted semantic-release metadata hop %s -> %s (version + changelog only)\n' "${parent}" "${child}"
    else
        printf 'ℹ️  accepted semantic-release metadata hop %s -> %s (version only)\n' "${parent}" "${child}"
    fi
    return 0
}

maintenance_only_hop() {
    local parent="$1"
    local child="$2"
    local parent_count
    local file

    parent_count="$(git rev-list --parents -n 1 "${child}" | awk '{print NF - 1}')"
    if [[ "${parent_count}" != "1" ]]; then
        printf '❌ PROD_BASE_MAINTENANCE_GRAPH: maintenance candidate %s has %s parents; baseline inheritance requires a linear single-parent commit\n' \
            "${child}" "${parent_count}" >&2
        return 1
    fi

    mapfile -t maintenance_files < <(git diff --name-only --diff-filter=ACMRD "${parent}" "${child}" | awk 'NF' | sort -u)
    if (("${#maintenance_files[@]}" == 0)); then
        return 1
    fi

    for file in "${maintenance_files[@]}"; do
        case "${file}" in
            .assetsignore | docs/* | unit-tests/* | *.md | .github/* | .vscode/* | .idea/* | .agents/* | .cursor/* | .claude/* | .zap/* | .pre-commit-config.yaml | .pre-commit-pre-push.yaml | .python-version | mise.toml | eslint.config.js | stylelint.config.cjs | scripts/agent-quality-gate.sh | scripts/check_code_size.py | scripts/ci-scope.sh | scripts/verify-production-baseline.sh | scripts/publish-vercel-preview-checkpoint.sh | scripts/quality-gate.sh | scripts/eslint-github-formatter.mjs)
                ;;
            *)
                printf '❌ PROD_BASE_MAINTENANCE_SCOPE: %s changes deploy-relevant file %s\n' "${child}" "${file}" >&2
                return 1
                ;;
        esac
    done

    printf 'ℹ️  accepted maintenance-only baseline hop %s -> %s\n' "${parent}" "${child}"
    return 0
}
