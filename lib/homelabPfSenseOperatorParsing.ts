import { isRecord } from "./homelabHealthValidation";
import type {
	PfSenseCacheEvidence,
	PfSenseEndpointEvidence,
	PfSenseObservedService,
	PfSenseOperatorEvidence,
	PfSenseServiceSummary,
} from "./homelabPfSenseOperatorTypes";

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalInteger(value: unknown): number | undefined {
	return typeof value === "number" && Number.isInteger(value) && value >= 0
		? value
		: undefined;
}

function parseEndpointStatus(
	value: unknown,
): Record<string, PfSenseEndpointEvidence> | undefined {
	if (!isRecord(value)) return undefined;
	const result: Record<string, PfSenseEndpointEvidence> = {};
	for (const [name, raw] of Object.entries(value)) {
		if (!isRecord(raw) || typeof raw.observed !== "boolean") continue;
		result[name] = {
			observed: raw.observed,
			...(optionalString(raw.error)
				? { error: optionalString(raw.error) }
				: {}),
		};
	}
	return Object.keys(result).length > 0 ? result : undefined;
}

function parseServices(value: unknown): PfSenseObservedService[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const rows = value.flatMap((raw): PfSenseObservedService[] => {
		if (
			!isRecord(raw) ||
			!optionalString(raw.identity) ||
			!optionalString(raw.runtime_state)
		)
			return [];
		return [
			{
				identity: optionalString(raw.identity) as string,
				runtime_state: optionalString(raw.runtime_state) as string,
			},
		];
	});
	return rows.length > 0 ? rows : undefined;
}

function parseServiceSummary(
	value: unknown,
): PfSenseServiceSummary | undefined {
	if (!isRecord(value)) return undefined;
	const result: PfSenseServiceSummary = {};
	for (const key of ["running", "stopped", "unknown", "total"] as const) {
		const count = optionalInteger(value[key]);
		if (count !== undefined) result[key] = count;
	}
	return Object.keys(result).length > 0 ? result : undefined;
}

function parseCache(value: unknown): PfSenseCacheEvidence | undefined {
	if (!isRecord(value)) return undefined;
	const result: PfSenseCacheEvidence = {};
	if (optionalString(value.cache_layer))
		result.cache_layer = optionalString(value.cache_layer);
	for (const key of [
		"cached",
		"stale",
		"refresh_in_progress",
		"redis_available",
	] as const) {
		if (typeof value[key] === "boolean") result[key] = value[key];
	}
	if (
		typeof value.cache_age_seconds === "number" &&
		value.cache_age_seconds >= 0
	)
		result.cache_age_seconds = value.cache_age_seconds;
	return Object.keys(result).length > 0 ? result : undefined;
}

export function parsePfSenseOperatorEvidence(
	value: unknown,
): PfSenseOperatorEvidence | undefined {
	if (!isRecord(value)) return undefined;
	const endpointStatus = parseEndpointStatus(value.endpoint_status);
	const services = parseServices(value.services);
	const serviceSummary = parseServiceSummary(value.service_summary);
	const cache = parseCache(value.cache);
	const result: PfSenseOperatorEvidence = {
		...(optionalString(value.api_evidence_state)
			? { api_evidence_state: optionalString(value.api_evidence_state) }
			: {}),
		...(optionalInteger(value.successful_endpoint_count) !== undefined
			? {
					successful_endpoint_count: optionalInteger(
						value.successful_endpoint_count,
					),
				}
			: {}),
		...(optionalInteger(value.endpoint_count) !== undefined
			? { endpoint_count: optionalInteger(value.endpoint_count) }
			: {}),
		...(endpointStatus ? { endpoint_status: endpointStatus } : {}),
		...(typeof value.services_observed === "boolean"
			? { services_observed: value.services_observed }
			: {}),
		...(services ? { services } : {}),
		...(serviceSummary ? { service_summary: serviceSummary } : {}),
		...(typeof value.stale === "boolean" ? { stale: value.stale } : {}),
		...(typeof value.last_good_available === "boolean"
			? { last_good_available: value.last_good_available }
			: {}),
		...(optionalString(value.refresh_error)
			? { refresh_error: optionalString(value.refresh_error) }
			: {}),
		...(optionalString(value.refresh_error_stage)
			? { refresh_error_stage: optionalString(value.refresh_error_stage) }
			: {}),
		...(cache ? { cache } : {}),
	};
	return Object.keys(result).length > 0 ? result : undefined;
}
