import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabInternalHealthEntry,
	HomelabProbeSource,
	HomelabRollingProbeEvidence,
	TrueNasHealth,
} from "./homelabHealthTypes";
import { isHealthState, isRecord } from "./homelabHealthValidation";

const ROLLING_PROBE_KEYS = [
	"probe_source",
	"probe_observed_at",
	"probe_age_seconds",
	"probe_stale",
	"probe_stale_after_seconds",
	"probe_interval_seconds",
	"next_probe_in_seconds",
	"probe_refresh_error",
	"last_known_state",
	"last_known_reachable",
	"last_known_http_status",
	"warning",
	"timed_out",
	"error_kind",
] as const;

function isProbeSource(value: unknown): value is HomelabProbeSource {
	return value === "origin" || value === "memory" || value === "deadline";
}

function finiteNonNegative(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function nullableNonNegative(value: unknown): number | null | undefined {
	if (value === null) return null;
	return finiteNonNegative(value);
}

function nullableBoolean(value: unknown): boolean | null | undefined {
	return value === null || typeof value === "boolean" ? value : undefined;
}

function nullableString(value: unknown): string | null | undefined {
	return value === null || typeof value === "string" ? value : undefined;
}

function sanitizeRollingProbeEvidence(
	value: unknown,
): HomelabRollingProbeEvidence {
	if (!isRecord(value)) return {};
	const evidence: HomelabRollingProbeEvidence = {};
	if (isProbeSource(value.probe_source)) {
		evidence.probe_source = value.probe_source;
	}
	const observedAt = nullableString(value.probe_observed_at);
	if (observedAt !== undefined) evidence.probe_observed_at = observedAt;
	const age = nullableNonNegative(value.probe_age_seconds);
	if (age !== undefined) evidence.probe_age_seconds = age;
	if (typeof value.probe_stale === "boolean") {
		evidence.probe_stale = value.probe_stale;
	}
	for (const field of [
		"probe_stale_after_seconds",
		"probe_interval_seconds",
		"next_probe_in_seconds",
	] as const) {
		const parsed = finiteNonNegative(value[field]);
		if (parsed !== undefined) evidence[field] = parsed;
	}
	for (const field of [
		"probe_refresh_error",
		"warning",
		"error_kind",
	] as const) {
		if (typeof value[field] === "string") evidence[field] = value[field];
	}
	if (
		value.last_known_state === null ||
		isHealthState(value.last_known_state)
	) {
		evidence.last_known_state = value.last_known_state;
	}
	const lastReachable = nullableBoolean(value.last_known_reachable);
	if (lastReachable !== undefined) {
		evidence.last_known_reachable = lastReachable;
	}
	const lastStatus = nullableNonNegative(value.last_known_http_status);
	if (lastStatus !== undefined) evidence.last_known_http_status = lastStatus;
	if (typeof value.timed_out === "boolean") {
		evidence.timed_out = value.timed_out;
	}
	return evidence;
}

function stripRollingProbeEvidence<T extends object>(value: T): T {
	const sanitized = { ...value } as T & Record<string, unknown>;
	for (const key of ROLLING_PROBE_KEYS) delete sanitized[key];
	return sanitized;
}

function isRollingUnknownReachability(value: unknown): boolean {
	if (!isRecord(value) || value.reachable !== null) return false;
	const evidence = sanitizeRollingProbeEvidence(value);
	return evidence.probe_stale === true || evidence.probe_source === "memory";
}

function normalizeRollingProbeRow(value: unknown): unknown {
	if (!isRollingUnknownReachability(value)) return value;
	return { ...(value as Record<string, unknown>), reachable: false };
}

export function normalizeRollingProbePayload(value: unknown): unknown {
	if (!isRecord(value)) return value;
	const normalized: Record<string, unknown> = { ...value };
	for (const field of [
		"services",
		"public_probe_results",
		"internal_services",
	] as const) {
		if (Array.isArray(value[field])) {
			normalized[field] = value[field].map(normalizeRollingProbeRow);
		}
	}
	if (isRecord(value.truenas) && value.truenas.public !== undefined) {
		normalized.truenas = {
			...value.truenas,
			public: normalizeRollingProbeRow(value.truenas.public),
		};
	}
	return normalized;
}

function rollingRowKey(value: unknown): string | null {
	if (!isRecord(value)) return null;
	if (typeof value.id === "string" && value.id.trim()) return `id:${value.id}`;
	if (typeof value.name === "string" && value.name.trim()) {
		return `name:${value.name}`;
	}
	return null;
}

function rawRowsByKey(value: unknown): Map<string, Record<string, unknown>> {
	const rows = new Map<string, Record<string, unknown>>();
	if (!Array.isArray(value)) return rows;
	for (const row of value) {
		if (!isRecord(row)) continue;
		const key = rollingRowKey(row);
		if (key) rows.set(key, row);
	}
	return rows;
}

export function enrichPublicRollingEvidence(
	entries: HomelabHealthEntry[],
	raw: unknown,
): HomelabHealthEntry[] {
	const rows = rawRowsByKey(raw);
	return entries.map((entry) => {
		const rawEntry = rows.get(rollingRowKey(entry) ?? "");
		if (!rawEntry) return entry;
		const base = stripRollingProbeEvidence(entry);
		return {
			...base,
			...sanitizeRollingProbeEvidence(rawEntry),
			reachable: isRollingUnknownReachability(rawEntry)
				? null
				: entry.reachable,
		};
	});
}

export function enrichInternalRollingEvidence(
	entries: HomelabInternalHealthEntry[] | undefined,
	raw: unknown,
): HomelabInternalHealthEntry[] | undefined {
	if (!entries) return entries;
	const rows = rawRowsByKey(raw);
	return entries.map((entry) => {
		const rawEntry = rows.get(rollingRowKey(entry) ?? "");
		if (!rawEntry) return entry;
		const base = stripRollingProbeEvidence(entry);
		return {
			...base,
			...sanitizeRollingProbeEvidence(rawEntry),
			reachable: isRollingUnknownReachability(rawEntry)
				? null
				: entry.reachable,
		};
	});
}

export function enrichTrueNasRollingEvidence(
	truenas: TrueNasHealth | null | undefined,
	raw: unknown,
): TrueNasHealth | null | undefined {
	if (!truenas?.public || !isRecord(raw)) return truenas;
	const base = stripRollingProbeEvidence(truenas.public);
	return {
		...truenas,
		public: {
			...base,
			...sanitizeRollingProbeEvidence(raw.public),
			reachable: isRollingUnknownReachability(raw.public)
				? null
				: truenas.public.reachable,
		},
	};
}

export function enrichRollingProbeSnapshot(
	snapshot: HomelabHealthSnapshot,
	raw: unknown,
): HomelabHealthSnapshot {
	if (!isRecord(raw)) return snapshot;
	return {
		...snapshot,
		services: enrichPublicRollingEvidence(snapshot.services, raw.services),
		internal_services: enrichInternalRollingEvidence(
			snapshot.internal_services,
			raw.internal_services,
		),
		truenas: enrichTrueNasRollingEvidence(snapshot.truenas, raw.truenas),
	};
}
