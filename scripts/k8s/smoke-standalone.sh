#!/usr/bin/env bash
set -euo pipefail

image="${1:?Usage: bash scripts/k8s/smoke-standalone.sh IMAGE}"
for command in docker curl; do
  command -v "${command}" >/dev/null || { echo "Missing command: ${command}" >&2; exit 2; }
done

# Keep OWNER data closed. Never inject Vercel edge variables or admin keys.
container="$(docker run -d --rm --read-only \
  --cap-drop ALL --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --tmpfs /app/.next/cache:rw,nosuid,size=128m \
  --user 10001:10001 \
  --publish 127.0.0.1:18080:3000 "${image}")"
cleanup() { docker stop "${container}" >/dev/null 2>&1 || true; }
trap cleanup EXIT
for attempt in $(seq 1 30); do
  if curl -fsSL --max-time 4 http://127.0.0.1:18080/fr > /dev/null; then
    break
  fi
  if [[ "${attempt}" == 30 ]]; then
    docker logs "${container}" >&2
    echo "Next.js /fr unavailable" >&2
    exit 1
  fi
  sleep 2
done

access="$(curl -fsS --max-time 5 http://127.0.0.1:18080/api/homelab-access)"
node -e 'const p = JSON.parse(process.argv[1]); if(p.trusted !== false) process.exit(1)' "${access}" || {
  echo "OWNER access unexpectedly opened without Vercel edge" >&2
  exit 1
}
uid="$(docker exec "${container}" id -u)"
[[ "${uid}" == 10001 ]] || { echo "Unexpected container UID: ${uid}" >&2; exit 1; }
printf 'K8S_NEXT_STANDALONE_SMOKE_PASS image=%s uid=%s owner=closed\n' "${image}" "${uid}"
