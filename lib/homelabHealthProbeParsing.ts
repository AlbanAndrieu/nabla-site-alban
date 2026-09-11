import type {
	HomelabHealthBoardMetadata,
	HomelabProbeCache,
	HomelabProbeEvidenceSummary,
	HomelabProbeSampling,
	HomelabProbeScopeSummary,
	HomelabProbeStateCounts,
	HomelabProbeSummary,
	HomelabReconciliationMetadata,
} from "./homelabHealthTypes";
import { isRecord, optionalNonNegativeInteger } from "./homelabHealthValidation";

function parseProbeStateCounts(
	value: unknown,
): HomelabProbeStateCounts | undefined {
	if (!isRecord(value)) return undefined;
	const states: HomelabProbeStateCounts = {};
	for (const state of ["ok", "warn", "fail"] as const) {
		const count = optionalNonNegativeInteger(value[state]);
		if (count !== undefined) states[state] = count;
	}
	return states;
}

function parseProbeEvidenceSummary(
	value: unknown,
): HomelabProbeEvidenceSummary | undefined {
	if (!isRecord(value)) return undefined;
	const evidence: HomelabProbeEvidenceSummary = {};
	for (const field of ["known", "fresh", "cached"] as const) {
		const parsed = optionalNonNegativeInteger(value[field]);
		if (parsed !== undefined) evidence[field] = parsed;
	}
	for (const field of [
		"coverage_percent",
		"evidence_ttl_seconds",
		"evidence_max_retention_seconds",
	] as const) {
		const parsed = value[field];
		if (typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0) {
			evidence[field] = parsed;
		}
	}
	return evidence;
}

function parseProbeScopeSummary(
	value: unknown,
): HomelabProbeScopeSummary | undefined {
	if (!isRecord(value)) return undefined;
	const summary: HomelabProbeScopeSummary = {};
	if (typeof value.scope === "string" && value.scope.trim()) {
		summary.scope = value.scope;
	}
	if (typeof value.enabled === "boolean") summary.enabled = value.enabled;
	if (typeof value.rotating_sample === "boolean") {
		summary.rotating_sample = value.rotating_sample;
	}
	for (const field of [
		"eligible",
		"sampled",
		"scheduled",
		"completed",
		"timed_out",
		"max_concurrency",
	] as const) {
		const parsed = optionalNonNegativeInteger(value[field]);
		if (parsed !== undefined) summary[field] = parsed;
	}
	for (const field of [
		"budget_seconds",
		"per_probe_timeout_seconds",
		"elapsed_ms",
	] as const) {
		const parsed = value[field];
		if (typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0) {
			summary[field] = parsed;
		}
	}
	const states = parseProbeStateCounts(value.states);
	if (states) summary.states = states;
	const evidence = parseProbeEvidenceSummary(value.evidence);
	if (evidence) summary.evidence = evidence;
	return summary;
}

export function parseProbeSummary(
	value: unknown,
): HomelabProbeSummary | undefined {
	if (!isRecord(value)) return undefined;
	const summary: HomelabProbeSummary = {};
	const publicSummary = parseProbeScopeSummary(value.public);
	const internalSummary = parseProbeScopeSummary(value.internal);
	const catalogCount = optionalNonNegativeInteger(value.catalog_service_count);
	if (publicSummary) summary.public = publicSummary;
	if (internalSummary) summary.internal = internalSummary;
	if (catalogCount !== undefined) summary.catalog_service_count = catalogCount;
	if (isRecord(value.sampling)) {
		const sampling: HomelabProbeSampling = {};
		if (
			typeof value.sampling.strategy === "string" &&
			value.sampling.strategy.trim()
		) {
			sampling.strategy = value.sampling.strategy;
		}
		if (
			typeof value.sampling.cache_ttl_seconds === "number" &&
			Number.isFinite(value.sampling.cache_ttl_seconds) &&
			value.sampling.cache_ttl_seconds >= 0
		) {
			sampling.cache_ttl_seconds = value.sampling.cache_ttl_seconds;
		}
		summary.sampling = sampling;
	}
	return summary;
}

export function parseProbeCache(value: unknown): HomelabProbeCache | undefined {
	if (!isRecord(value)) return undefined;
	const cache: HomelabProbeCache = {};
	if (value.source === "origin" || value.source === "memory") {
		cache.source = value.source;
	}
	for (const field of ["age_seconds", "ttl_seconds"] as const) {
		const raw = value[field];
		if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
			cache[field] = raw;
		}
	}
	if (typeof value.stale === "boolean") cache.stale = value.stale;
	return cache;
}

export function parseHealthBoardMetadata(
	value: unknown,
): HomelabHealthBoardMetadata | undefined {
	if (!isRecord(value)) return undefined;
	if (
		(value.state !== "pending" &&
			value.state !== "fresh" &&
			value.state !== "stale") ||
		typeof value.refreshing !== "boolean" ||
		(value.generated_at !== null && typeof value.generated_at !== "string")
	) {
		return undefined;
	}
	const metadata: HomelabHealthBoardMetadata = {
		state: value.state,
		refreshing: value.refreshing,
		generated_at: value.generated_at,
	};
	for (const field of ["age_seconds", "retry_after_seconds"] as const) {
		const raw = value[field];
		if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
			metadata[field] = raw;
		}
	}
	if (typeof value.error === "string" || value.error === null) {
		metadata.error = value.error;
	}
	return metadata;
}

export function parseReconciliationMetadata(
	value: unknown,
): HomelabReconciliationMetadata | undefined {
	if (!isRecord(value)) return undefined;
	const metadata: HomelabReconciliationMetadata = {};
	if (typeof value.provider_reads_reused === "boolean") {
		metadata.provider_reads_reused = value.provider_reads_reused;
	}
	if (
		typeof value.truenas_runtime_source === "string" &&
		value.truenas_runtime_source.trim()
	) {
		metadata.truenas_runtime_source = value.truenas_runtime_source;
	}
	return metadata;
}
