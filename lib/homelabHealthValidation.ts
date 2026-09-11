import type {
	HomelabHealthEntry,
	HomelabHealthState,
	HomelabInternalHealthEntry,
	TrueNasApiHealth,
	TrueNasHealth,
	VerifiedHomelabHealthState,
} from "./homelabHealthTypes";

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isHealthState(value: unknown): value is HomelabHealthState {
	return (
		value === "ok" ||
		value === "warn" ||
		value === "fail" ||
		value === "unknown"
	);
}

export function isVerifiedHealthState(
	value: unknown,
): value is VerifiedHomelabHealthState {
	return value === "ok" || value === "warn" || value === "fail";
}

export function normalizeHomelabHealthUrl(url?: string): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return null;
		}
		parsed.hash = "";
		return parsed.href;
	} catch {
		return null;
	}
}

export function validOptionalBoolean(value: unknown): boolean {
	return value === undefined || value === null || typeof value === "boolean";
}

export function validOptionalNumber(value: unknown): boolean {
	return (
		value === undefined ||
		(typeof value === "number" && Number.isFinite(value) && value >= 0)
	);
}

export function validOptionalNullableNumber(value: unknown): boolean {
	return value === null || validOptionalNumber(value);
}

export function validOptionalString(value: unknown): boolean {
	return value === undefined || value === null || typeof value === "string";
}

export function validOptionalHealthState(value: unknown): boolean {
	return value === undefined || value === null || isHealthState(value);
}

export function validOptionalStringArray(value: unknown): boolean {
	return (
		value === undefined ||
		(Array.isArray(value) &&
			value.every((item) => typeof item === "string" && item.trim().length > 0))
	);
}

export function optionalNonNegativeInteger(value: unknown): number | undefined {
	return typeof value === "number" && Number.isInteger(value) && value >= 0
		? value
		: undefined;
}

function validDependencyEvidence(value: unknown): boolean {
	if (value === undefined) return true;
	if (!Array.isArray(value)) return false;
	return value.every(
		(item) =>
			isRecord(item) &&
			typeof item.target === "string" &&
			item.target.trim().length > 0 &&
			(item.target_name === undefined ||
				typeof item.target_name === "string") &&
			typeof item.relation_type === "string" &&
			item.relation_type.trim().length > 0 &&
			isHealthState(item.target_state) &&
			validOptionalHealthState(item.target_effective_state) &&
			validOptionalString(item.target_observed_at) &&
			validOptionalNullableNumber(item.target_observation_age_seconds) &&
			validOptionalBoolean(item.target_observation_stale) &&
			Array.isArray(item.evidence) &&
			item.evidence.every(
				(evidence) =>
					typeof evidence === "string" && evidence.trim().length > 0,
			) &&
			(item.description === undefined || typeof item.description === "string"),
	);
}

export function validHealthEntry(entry: unknown): entry is HomelabHealthEntry {
	if (!isRecord(entry)) return false;
	return (
		(entry.id === undefined || typeof entry.id === "string") &&
		typeof entry.name === "string" &&
		entry.name.trim().length > 0 &&
		typeof entry.url === "string" &&
		normalizeHomelabHealthUrl(entry.url) !== null &&
		validOptionalBoolean(entry.url_derived) &&
		typeof entry.reachable === "boolean" &&
		typeof entry.http_status === "number" &&
		Number.isFinite(entry.http_status) &&
		isHealthState(entry.state) &&
		validOptionalHealthState(entry.local_state) &&
		validOptionalHealthState(entry.dependency_state) &&
		validOptionalHealthState(entry.effective_state) &&
		validOptionalStringArray(entry.required_dependencies) &&
		validOptionalStringArray(entry.blocked_by) &&
		validOptionalStringArray(entry.dependency_cycle) &&
		validDependencyEvidence(entry.dependency_evidence) &&
		validOptionalString(entry.observed_at) &&
		validOptionalNullableNumber(entry.observation_age_seconds) &&
		validOptionalBoolean(entry.observation_stale) &&
		validOptionalBoolean(entry.tls_trusted) &&
		validOptionalNumber(entry.latency_ms) &&
		(entry.error === undefined || typeof entry.error === "string") &&
		validOptionalString(entry.application_error) &&
		validOptionalString(entry.tunnel_status) &&
		validOptionalString(entry.tunnel_name) &&
		validOptionalHealthState(entry.direct_state) &&
		validOptionalHealthState(entry.internal_state) &&
		validOptionalString(entry.runtime_state) &&
		validOptionalString(entry.runtime_app) &&
		validOptionalBoolean(entry.runtime_reachable) &&
		validOptionalBoolean(entry.runtime_missing) &&
		validOptionalBoolean(entry.runtime_stale) &&
		validOptionalBoolean(entry.tunnel_stale)
	);
}

export function validInternalHealthEntry(
	entry: unknown,
): entry is HomelabInternalHealthEntry {
	if (!isRecord(entry)) return false;
	return (
		(entry.id === undefined || typeof entry.id === "string") &&
		typeof entry.name === "string" &&
		entry.name.trim().length > 0 &&
		typeof entry.host === "string" &&
		entry.host.trim().length > 0 &&
		typeof entry.port === "number" &&
		Number.isInteger(entry.port) &&
		entry.port >= 1 &&
		entry.port <= 65535 &&
		typeof entry.reachable === "boolean" &&
		isVerifiedHealthState(entry.state) &&
		validOptionalNumber(entry.latency_ms) &&
		(entry.error === undefined || typeof entry.error === "string")
	);
}

export function validTrueNasApiHealth(
	value: unknown,
): value is TrueNasApiHealth {
	if (!isRecord(value) || typeof value.reachable !== "boolean") return false;
	return value.error === undefined || typeof value.error === "string";
}

export function validTrueNasHealth(value: unknown): value is TrueNasHealth {
	if (!isRecord(value) || !isVerifiedHealthState(value.state)) return false;
	if (
		value.public !== undefined &&
		value.public !== null &&
		!validHealthEntry(value.public)
	) {
		return false;
	}
	if (
		value.internal !== undefined &&
		value.internal !== null &&
		!validInternalHealthEntry(value.internal)
	) {
		return false;
	}
	if (
		value.api !== undefined &&
		value.api !== null &&
		!validTrueNasApiHealth(value.api)
	) {
		return false;
	}
	return (
		validOptionalBoolean(value.internal_probe_enabled) &&
		validOptionalBoolean(value.verify_ssl)
	);
}
