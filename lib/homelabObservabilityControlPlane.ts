import type { OperationalComponentEvidence } from "./homelabOperationalEvidence";
import {
	isRecord,
	optionalBoolean,
	optionalNumber,
	optionalString,
	parseCache,
} from "./homelabObservabilityParsing";
import type {
	CloudflareCacheEvidence,
	ControlPlaneDiagnosticEvidence,
	EdgeEvidenceSkip,
	PfSenseIngressPolicyEvidence,
} from "./homelabObservabilityTypes";

export function parseEdgeEvidenceSkips(sickzValue: unknown): EdgeEvidenceSkip[] {
	if (!isRecord(sickzValue) || !isRecord(sickzValue.checks)) return [];
	return Object.entries(sickzValue.checks).flatMap(([id, value]) => {
		if (!isRecord(value) || value.http_evidence_skipped !== true) return [];
		const reason = optionalString(value.http_evidence_skip_reason);
		return reason ? [{ id, reason }] : [];
	});
}

export function parsePfSenseIngressPolicy(
	healthzValue: unknown,
): PfSenseIngressPolicyEvidence | null {
	if (!isRecord(healthzValue) || !isRecord(healthzValue.checks)) return null;
	const pfsense = healthzValue.checks.pfsense;
	if (!isRecord(pfsense) || !isRecord(pfsense.ingress_policy)) return null;
	const policy = pfsense.ingress_policy;
	const state = optionalString(policy.state);
	if (!state) return null;
	return {
		state,
		...(optionalString(policy.access_policy)
			? { accessPolicy: optionalString(policy.access_policy) }
			: {}),
		activeEgressIps: Array.isArray(policy.active_egress_ips)
			? policy.active_egress_ips.filter(
					(value): value is string =>
						typeof value === "string" && Boolean(value.trim()),
				)
			: [],
		possibleCauses: Array.isArray(policy.possible_causes)
			? policy.possible_causes.filter(
					(value): value is string =>
						typeof value === "string" && Boolean(value.trim()),
				)
			: [],
		attributionAvailable:
			typeof policy.attribution_available === "boolean"
				? policy.attribution_available
				: null,
		...(optionalString(policy.detail)
			? { detail: optionalString(policy.detail) }
			: {}),
		...(optionalString(policy.recommended_control_path)
			? {
					recommendedControlPath: optionalString(
						policy.recommended_control_path,
					),
				}
			: {}),
	};
}

export function parseCloudflareCache(
	homelabValue: unknown,
): CloudflareCacheEvidence | null {
	if (!isRecord(homelabValue) || !isRecord(homelabValue.cloudflare))
		return null;
	const raw = homelabValue.cloudflare;
	const nestedCache = parseCache(raw.cache);
	return {
		stale: raw.stale === true || nestedCache?.stale === true,
		...(optionalString(raw.refresh_error)
			? { refreshError: optionalString(raw.refresh_error) }
			: {}),
		...(nestedCache ? { cache: nestedCache } : {}),
	};
}

export function parseControlPlaneDiagnostics(
	homelabValue: unknown,
): Partial<
	Record<OperationalComponentEvidence["id"], ControlPlaneDiagnosticEvidence>
> {
	if (!isRecord(homelabValue) || !isRecord(homelabValue.components)) return {};
	const result: Partial<
		Record<OperationalComponentEvidence["id"], ControlPlaneDiagnosticEvidence>
	> = {};
	for (const id of ["truenas", "pfsense", "cloudflare"] as const) {
		const raw = homelabValue.components[id];
		if (!isRecord(raw)) continue;
		const cache = parseCache(raw);
		result[id] = {
			...(cache ? { cache } : {}),
			...(optionalString(raw.exception_type)
				? { exceptionType: optionalString(raw.exception_type) }
				: {}),
			...(optionalString(raw.probe)
				? { probe: optionalString(raw.probe) }
				: {}),
			...(optionalString(raw.path) ? { path: optionalString(raw.path) } : {}),
			...(optionalNumber(raw.retry_after_seconds) !== undefined
				? { retryAfterSeconds: optionalNumber(raw.retry_after_seconds) }
				: {}),
			...(optionalBoolean(raw.verify_ssl) !== undefined
				? { verifySsl: optionalBoolean(raw.verify_ssl) }
				: {}),
		};
	}
	return result;
}
