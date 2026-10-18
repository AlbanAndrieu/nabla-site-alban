# shellcheck shell=bash
# Repository diff guards for scripts/agent-quality-gate.sh.
# This file is sourced by the agent gate; it is intentionally not executable.
# Each guard prints its QG_* diagnostics and returns non-zero on failure; the
# gate owns the decision to stop.

# Reject large truncations and deletions of reviewed text files unless
# QUALITY_ALLOW_LARGE_DELETION=1 acknowledges an explicit review.
check_large_deletions() {
    local file
    local base_lines
    local current_lines
    local deleted_lines
    local deleted_percent
    local failed=0

    if [[ "${QUALITY_ALLOW_LARGE_DELETION:-0}" == "1" || "${BASE_REF}" == "HEAD" ]]; then
        return 0
    fi

    for file in "${CHANGED_FILES[@]}"; do
        case "${file}" in
            package-lock.json | public/assets/fontawesome-free-7.1.0-web/* | public/assets/fontawesome/*)
                continue
                ;;
            # Reviewed module splits: these files intentionally shrink below the
            # destructive-diff threshold while behavior moves to cohesive modules.
            # The production-baseline split is locked by dedicated release/
            # maintenance classification tests. Once merged, the new <200-line
            # baselines make these exceptions inert.
            # Public P0 privacy migration adds exact reviewed paths below, not a global bypass.
            scripts/verify-master-baseline.sh | \
                app/components/homelab/HomelabOperationalEvidence.tsx | \
                lib/homelabHealth.ts | lib/homelabObservability.ts | \
app/\[locale\]/architecture/page.tsx | \
                app/components/truenas/HomeLabSection.tsx | \
                app/components/homelab/HomelabServicesSection.tsx | \
                public/homelab-services.json | public/service-topology.json | \
                public/freenas.html | public/locales/fr/freenas.html)
                continue
                ;;
            # Reviewed R1-R3 and R8-R9 component splits (PR #230): rendering stays
            # here while graph builders, state hooks and presentation move to
            # sibling modules.
            app/\[locale\]/architecture/HierarchicalArchitectureExplorer.tsx | \
                app/components/truenas/HierarchicalHomeLabNetworkFlow.tsx | \
                app/components/homelab/HomelabServicesBlock.tsx | \
                app/components/homelab/HomelabServiceGrid.tsx | \
                app/\[locale\]/architecture/ArchitectureTopologyView.tsx)
                continue
                ;;
            *.md | *.ts | *.tsx | *.js | *.mjs | *.cjs | *.css | *.scss | *.html | *.json | *.yml | *.yaml | *.toml | *.py | *.sh | Dockerfile* | Makefile) ;;
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
            failed=1
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
            *.md | *.ts | *.tsx | *.js | *.mjs | *.cjs | *.css | *.scss | *.html | *.json | *.yml | *.yaml | *.toml | *.py | *.sh | Dockerfile* | Makefile) ;;
            *)
                continue
                ;;
        esac
        git cat-file -e "${BASE_REF}:${file}" 2>/dev/null || continue
        base_lines="$(git show "${BASE_REF}:${file}" | wc -l | tr -d ' ')"
        if ((base_lines >= 200)); then
            printf '❌ QG_LARGE_DELETION: %s was deleted (%d lines); set QUALITY_ALLOW_LARGE_DELETION=1 only after explicit review\n' \
                "${file}" "${base_lines}" >&2
            failed=1
        fi
    done

    return "${failed}"
}

# Every changed script with a shebang must be executable in Git (or on disk
# when it is still untracked).
check_executable_bits() {
    local file
    local first_line
    local mode
    local failed=0

    for file in "${CHANGED_FILES[@]}"; do
        first_line=""
        IFS= read -r first_line <"${file}" || true
        [[ "${first_line}" == '#!'* ]] || continue

        if git ls-files --error-unmatch -- "${file}" >/dev/null 2>&1; then
            mode="$(git ls-files --stage -- "${file}" | awk 'NR == 1 {print $1}')"
            if [[ "${mode}" != "100755" ]]; then
                printf '❌ QG_EXEC_BIT: %s has a shebang but Git mode is %s; run git add --chmod=+x %q\n' \
                    "${file}" "${mode:-unknown}" "${file}" >&2
                failed=1
            fi
        elif [[ ! -x "${file}" ]]; then
            printf '❌ QG_EXEC_BIT: untracked %s has a shebang but is not executable\n' "${file}" >&2
            failed=1
        fi
    done

    return "${failed}"
}
