#!/usr/bin/env bash
# Fail when the active npm differs from the version pinned in mise.toml,
# the single source of truth for local, CI and Dagger npm.
set -euo pipefail

MISE_TOML="${1:-mise.toml}"

expected="$(sed -n 's/^npm = "\([^"]*\)"/\1/p' "${MISE_TOML}" | head -n1)"
if [[ -z "${expected}" ]]; then
    printf '❌ MISE_NPM_UNPINNED: %s does not pin npm\n' "${MISE_TOML}" >&2
    exit 1
fi

actual="$(npm --version)"
if [[ "${actual}" != "${expected}" ]]; then
    printf '❌ MISE_NPM_MISMATCH: expected=%s actual=%s (%s)\n' "${expected}" "${actual}" "$(command -v npm)" >&2
    exit 1
fi

printf '✅ MISE_NPM_OK npm=%s node=%s\n' "${actual}" "$(node --version)"
