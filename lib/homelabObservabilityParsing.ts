import type { ProbeCacheEvidence } from "./homelabObservabilityTypes";

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

export function optionalBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}

export function nullableBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

export function parseCache(value: unknown): ProbeCacheEvidence | undefined {
	if (!isRecord(value)) return undefined;
	const cache: ProbeCacheEvidence = {
		...(optionalString(value.cache_layer)
			? { layer: optionalString(value.cache_layer) }
			: {}),
		...(optionalBoolean(value.cached) !== undefined
			? { cached: optionalBoolean(value.cached) }
			: {}),
		...(optionalBoolean(value.stale) !== undefined
			? { stale: optionalBoolean(value.stale) }
			: {}),
		...(optionalBoolean(value.refresh_in_progress) !== undefined
			? { refreshInProgress: optionalBoolean(value.refresh_in_progress) }
			: {}),
		...(optionalBoolean(value.redis_available) !== undefined
			? { redisAvailable: optionalBoolean(value.redis_available) }
			: {}),
		...(optionalNumber(value.cache_age_seconds) !== undefined
			? { ageSeconds: optionalNumber(value.cache_age_seconds) }
			: {}),
	};
	return Object.keys(cache).length ? cache : undefined;
}
