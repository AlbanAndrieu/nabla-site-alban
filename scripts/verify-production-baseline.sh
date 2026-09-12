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

	normalized_filter='del(.version) | if ((.packages // {}) | has("") ) then .packages[""] |= del(.version) else . end'
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

	if [[ "${parent_package_version}" != "${parent_lock_version}" || "${parent_package_version}" != "${parent_lock_root_version}" ]]; then
		printf '❌ PROD_BASE_RELEASE_VERSION: parent %s has inconsistent package/lock versions\n' "${parent}" >&2
		return 1
	fi
	if [[ "${child_package_version}" != "${child_lock_version}" || "${child_package_version}" != "${child_lock_root_version}" ]]; then
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
			.assetsignore | docs/* | unit-tests/* | *.md | .github/* | .vscode/* | .idea/* | .agents/* | .cursor/* | .claude/* | .zap/* | .pre-commit-config.yaml | .pre-commit-pre-push.yaml | .python-version | mise.toml | eslint.config.js | stylelint.config.cjs | scripts/agent-quality-gate.sh | scripts/ci-scope.sh | scripts/verify-production-baseline.sh | scripts/quality-gate.sh | scripts/eslint-github-formatter.mjs)
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
		((release_hops += 1))
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
		((maintenance_hops += 1))
		continue
	fi

	printf '❌ PROD_BASE_RELEASE_SCOPE: cannot inherit an older production baseline across %s\n' "${candidate}" >&2
	exit 1
done
