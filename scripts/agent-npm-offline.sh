#!/usr/bin/env bash
set -euo pipefail

# No-DNS npm preflight. Offline cache misses are fatal, never network fallbacks.
mode="${1:-check}"
if [[ "${mode}" != check && "${mode}" != install ]]; then
    echo 'usage: bash scripts/agent-npm-offline.sh [check|install]' >&2
    exit 2
fi
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"
if [[ ! -f package-lock.json ]]; then
    echo 'QG_NPM_LOCK_MISSING: cannot prove dependency reproducibility' >&2
    exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
    echo 'QG_NPM_MISSING: cannot inspect offline cache' >&2
    exit 1
fi
if [[ -d node_modules ]]; then
    echo 'QG_NPM_DEPS_PRESENT: existing node_modules; integrity and version parity NOT proven'
else
    echo 'QG_NPM_DEPS_MISSING: no node_modules; cache may be incomplete'
fi
if [[ "${mode}" == check ]]; then
    echo 'QG_NPM_OFFLINE_CHECK: no network request, no install; strict publication NOT_RUN'
    exit 0
fi
if [[ -e node_modules ]]; then
    echo 'QG_NPM_OFFLINE_INSTALL_REFUSED: existing node_modules must be reviewed before installation' >&2
    exit 1
fi
if npm ci --offline --ignore-scripts --no-audit --no-fund --loglevel=error; then
    echo 'QG_NPM_OFFLINE_INSTALL_OK: dependencies installed from cache; hooks and strict gate NOT_RUN'
else
    rc=$?
    echo 'QG_NPM_OFFLINE_CACHE_MISS: cache incomplete; no DNS fallback attempted' >&2
    exit "${rc}"
fi
