import {
	HOMELAB_HEALTH_DEFAULT_API_URL as BASE_HEALTH_DEFAULT_API_URL,
	HOMELAB_PROBES_DEFAULT_API_URL as BASE_PROBES_DEFAULT_API_URL,
	normalizeHomelabHealthUrl as normalizeBaseHealthUrl,
	parseHomelabHealthSnapshot as parseBaseHealthSnapshot,
} from "./homelabHealthBase";

export type VerifiedHomelabHealthState = "ok" | "warn" | "fail";
export type HomelabHealthState = VerifiedHomelabHealthState | "unknown";
export type HomelabProbeSource = "origin" | "memory" | "deadline";

export type HomelabDependencyEvidence = {
	target: string;
	target_name?: string;
	relation_type: string;
	target_state: HomelabHealthState;
	target_effective_state?: HomelabHealthState;
	target_observed_at?: string | null;
	target_observation_age_seconds?: number | null;
	target_observation_stale?: boolean;
	evidence: string[];
	description?: string;
};

export type HomelabRollingProbeEvidence = {
	probe_source?: HomelabProbeSource;
	probe_observed_at?: string | null;
	probe_age_seconds?: number | null;
	probe_stale?: boolean;
	probe_stale_after_seconds?: number;
	probe_interval_seconds?: number;
	next_probe_in_seconds?: number;
	probe_refresh_error?: string;
	last_known_state?: HomelabHealthState | null;
	last_known_reachable?: boolean | null;
	last_known_http_status?: number | null;
	warning?: string;
	timed_out?: boolean;
	error_kind?: string;
};

export type HomelabHealthEntry = HomelabRollingProbeEvidence & {
	id?: string;
	name: string;
	url: string;
	url_derived?: boolean;
	reachable: boolean | null;
	http_status: number;
	state: HomelabHealthState;
	local_state?: HomelabHealthState;
	dependency_state?: HomelabHealthState | null;
	effective_state?: HomelabHealthState;
	required_dependencies?: string[];
	blocked_by?: string[];
	dependency_cycle?: string[];
	dependency_evidence?: HomelabDependencyEvidence[];
	observed_at?: string | null;
	observation_age_seconds?: number | null;
	observation_stale?: boolean;
	tls_trusted?: boolean | null;
	latency_ms?: number;
	error?: string;
	application_error?: string | null;
	tunnel_status?: string | null;
	tunnel_name?: string | null;
	direct_state?: HomelabHealthState | null;
	internal_state?: HomelabHealthState | null;
	runtime_state?: string | null;
	runtime_app?: string | null;
	runtime_reachable?: boolean | null;
	runtime_missing?: boolean;
	runtime_stale?: boolean;
	tunnel_stale?: boolean;
};

export type HomelabInternalHealthEntry = HomelabRollingProbeEvidence & {
	id?: string;
	name: string;
	host: string;
	port: number;
	reachable: boolean | null;
	state: VerifiedHomelabHealthState;
	latency_ms?: number;
	error?: string;
};

export type TrueNasApiHealth = {
	reachable: boolean;
	error?: string;
};

export type TrueNasHealth = {
	state: VerifiedHomelabHealthState;
	public?: HomelabHealthEntry | null;
	internal?: HomelabInternalHealthEntry | null;
	api?: TrueNasApiHealth | null;
	internal_probe_enabled?: boolean;
	verify_ssl?: boolean;
};

export type PfSenseDnsResolverPosture = {
	enabled?: boolean | null;
	running?: boolean | null;
	forwarding?: boolean | null;
	forward_tls_upstream?: boolean | null;
	port?: number | null;
};

export type PfSenseDnsUpstreamPosture = {
	count: number;
	independent_from_truenas?: boolean | null;
	truenas_only?: boolean | null;
};

export type PfSenseSecurityFilterObservation = {
	id: string;
	label: string;
	state: string;
	detail: string;
};

export type PfSenseIngressEndpoint = {
	ip?: string | null;
	port?: number;
	role?: string;
};

export type PfSenseIngressControlPath = {
	mode: string;
	independent_from_wan_filter: boolean;
	blind_spot: boolean;
	detail: string;
};

export type PfSenseIngressBlockObservation = {
	state: string;
	telemetry_available: boolean;
	attribution_available: boolean;
	engine?: string;
	firewall?: string;
	mechanism?: string;
	evidence: string;
	source?: PfSenseIngressEndpoint;
	destination?: PfSenseIngressEndpoint;
	table_entry_count?: number;
	control_path?: PfSenseIngressControlPath;
};

export type PfSenseDnsPosture = {
	configured: boolean;
	reachable: boolean | null;
	policy_state: HomelabHealthState;
	reason: string;
	resolver?: PfSenseDnsResolverPosture;
	upstream?: PfSenseDnsUpstreamPosture;
	security_filters?: PfSenseSecurityFilterObservation[];
	ingress_block?: PfSenseIngressBlockObservation;
	error_stage?: string;
	error?: string;
};

export type HomelabProbeStateCounts = {
	ok?: number;
	warn?: number;
	fail?: number;
};

export type HomelabProbeEvidenceSummary = {
	known?: number;
	fresh?: number;
	cached?: number;
	coverage_percent?: number;
	evidence_ttl_seconds?: number;
	evidence_max_retention_seconds?: number;
};

export type HomelabProbeScopeSummary = {
	scope?: string;
	enabled?: boolean;
	eligible?: number;
	sampled?: number;
	scheduled?: number;
	completed?: number;
	timed_out?: number;
	rotating_sample?: boolean;
	budget_seconds?: number;
	per_probe_timeout_seconds?: number;
	max_concurrency?: number;
	elapsed_ms?: number;
	states?: HomelabProbeStateCounts;
	evidence?: HomelabProbeEvidenceSummary;
};

export type HomelabProbeSampling = {
	strategy?: string;
	cache_ttl_seconds?: number;
};

export type HomelabProbeSummary = {
	public?: HomelabProbeScopeSummary;
	internal?: HomelabProbeScopeSummary;
	catalog_service_count?: number;
	sampling?: HomelabProbeSampling;
};

export type HomelabProbeCache = {
	source?: "origin" | "memory";
	age_seconds?: number;
	ttl_seconds?: number;
	stale?: boolean;
};

export type HomelabHealthBoardMetadata = {
	state: "pending" | "fresh" | "stale";
	refreshing: boolean;
	generated_at: string | null;
	age_seconds?: number;
	retry_after_seconds?: number;
	error?: string | null;
};

export type HomelabReconciliationMetadata = {
	provider_reads_reused?: boolean;
	truenas_runtime_source?: string;
};

export type HomelabHealthSnapshot = {
	schema_version: number;
	checked_at: string;
	refresh_elapsed_ms?: number;
	services: HomelabHealthEntry[];
	truenas?: TrueNasHealth | null;
	internal_probes_enabled?: boolean;
	internal_services?: HomelabInternalHealthEntry[];
	probe_summary?: HomelabProbeSummary;
	probe_cache?: HomelabProbeCache;
	health_board?: HomelabHealthBoardMetadata;
	reconciliation?: HomelabReconciliationMetadata;
	truenas_runtime_reachable?: boolean;
	truenas_runtime_stale?: boolean;
	cloudflare_configured?: boolean;
	cloudflare_tunnels_observed?: number;
	pfsense?: {
		dns?: PfSenseDnsPosture;
	};
};

export type HomelabHealthSource = "fastapi" | "fastapi-probes" | "unavailable";

export const HOMELAB_HEALTH_DEFAULT_API_URL = BASE_HEALTH_DEFAULT_API_URL;
export const HOMELAB_PROBES_DEFAULT_API_URL = BASE_PROBES_DEFAULT_API_URL;

const PRIMARY_TIMEOUT_MS = 8_000;
const PROBES_TIMEOUT_MS = 6_000;

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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHealthState(value: unknown): value is HomelabHealthState {
	return (
		value === "ok" ||
		value === "warn" ||
		value === "fail" ||
		value === "unknown"
	);
}

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
	if (isProbeSource(value.probe_source)) evidence.probe_source = value.probe_source;
	const observedAt = nullableString(value.probe_observed_at);
	if (observedAt !== undefined) evidence.probe_observed_at = observedAt;
	const age = nullableNonNegative(value.probe_age_seconds);
	if (age !== undefined) evidence.probe_age_seconds = age;
	if (typeof value.probe_stale === "boolean") evidence.probe_stale = value.probe_stale;
	for (const field of [
		"probe_stale_after_seconds",
		"probe_interval_seconds",
		"next_probe_in_seconds",
	] as const) {
		const parsed = finiteNonNegative(value[field]);
		if (parsed !== undefined) evidence[field] = parsed;
	}
	for (const field of ["probe_refresh_error", "warning", "error_kind"] as const) {
		if (typeof value[field] === "string") evidence[field] = value[field];
	}
	if (value.last_known_state === null || isHealthState(value.last_known_state)) {
		evidence.last_known_state = value.last_known_state;
	}
	const lastReachable = nullableBoolean(value.last_known_reachable);
	if (lastReachable !== undefined) evidence.last_known_reachable = lastReachable;
	const lastStatus = nullableNonNegative(value.last_known_http_status);
	if (lastStatus !== undefined) evidence.last_known_http_status = lastStatus;
	if (typeof value.timed_out === "boolean") evidence.timed_out = value.timed_out;
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
	// Retained evidence uses reachable=null to mean "not currently confirmed".
	// The compatibility parser predates that contract and accepts booleans only.
	return { ...(value as Record<string, unknown>), reachable: false };
}

function normalizeRollingProbePayload(value: unknown): unknown {
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

function enrichPublicRollingEvidence(
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
			reachable: isRollingUnknownReachability(rawEntry) ? null : entry.reachable,
		};
	});
}

function enrichInternalRollingEvidence(
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
			reachable: isRollingUnknownReachability(rawEntry) ? null : entry.reachable,
		};
	});
}

function enrichEvidenceRetention(
	parsed: HomelabHealthSnapshot,
	raw: unknown,
): HomelabHealthSnapshot {
	if (!isRecord(raw) || !isRecord(raw.probe_summary) || !parsed.probe_summary) {
		return parsed;
	}
	const probeSummary = { ...parsed.probe_summary };
	for (const scope of ["public", "internal"] as const) {
		const rawScope = raw.probe_summary[scope];
		const parsedScope = probeSummary[scope];
		if (
			!isRecord(rawScope) ||
			!isRecord(rawScope.evidence) ||
			!parsedScope?.evidence
		) {
			continue;
		}
		const maxRetention = finiteNonNegative(
			rawScope.evidence.evidence_max_retention_seconds,
		);
		if (maxRetention === undefined) continue;
		probeSummary[scope] = {
			...parsedScope,
			evidence: {
				...parsedScope.evidence,
				evidence_max_retention_seconds: maxRetention,
			},
		};
	}
	return { ...parsed, probe_summary: probeSummary };
}

export const normalizeHomelabHealthUrl = normalizeBaseHealthUrl;

export function parseHomelabHealthSnapshot(
	value: unknown,
): HomelabHealthSnapshot | null {
	const normalized = normalizeRollingProbePayload(value);
	const parsed = parseBaseHealthSnapshot(normalized);
	if (!parsed) return null;

	const raw = isRecord(value) ? value : {};
	let snapshot = parsed as unknown as HomelabHealthSnapshot;
	snapshot = {
		...snapshot,
		services: enrichPublicRollingEvidence(snapshot.services, raw.services),
		internal_services: enrichInternalRollingEvidence(
			snapshot.internal_services,
			raw.internal_services,
		),
	};

	if (isRecord(raw.truenas) && snapshot.truenas?.public) {
		const base = stripRollingProbeEvidence(snapshot.truenas.public);
		snapshot = {
			...snapshot,
			truenas: {
				...snapshot.truenas,
				public: {
					...base,
					...sanitizeRollingProbeEvidence(raw.truenas.public),
					reachable: isRollingUnknownReachability(raw.truenas.public)
						? null
						: snapshot.truenas.public.reachable,
				},
			},
		};
	}

	return enrichEvidenceRetention(snapshot, raw);
}

function primaryApiUrl(): string {
	return (
		process.env.HOMELAB_HEALTH_API_URL?.trim() || HOMELAB_HEALTH_DEFAULT_API_URL
	);
}

function probesApiUrl(): string {
	return (
		process.env.HOMELAB_PROBES_API_URL?.trim() || HOMELAB_PROBES_DEFAULT_API_URL
	);
}

async function loadSnapshot(
	primaryUrl: string,
	timeoutMs: number,
	userAgent: string,
	cacheControl?: string,
): Promise<HomelabHealthSnapshot> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(primaryUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": userAgent,
				...(cacheControl ? { "Cache-Control": cacheControl } : {}),
			},
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const snapshot = parseHomelabHealthSnapshot(await response.json());
		if (!snapshot) throw new Error("Invalid homelab health payload");
		return snapshot;
	} finally {
		clearTimeout(timeout);
	}
}

export async function loadHomelabHealthSnapshot(): Promise<{
	snapshot: HomelabHealthSnapshot | null;
	source: HomelabHealthSource;
	primaryUrl: string;
}> {
	const primaryUrl = primaryApiUrl();
	try {
		return {
			snapshot: await loadSnapshot(
				primaryUrl,
				PRIMARY_TIMEOUT_MS,
				"nabla-site-homelab-health/6.0",
			),
			source: "fastapi",
			primaryUrl,
		};
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[homelab-health] FastAPI snapshot unavailable (${primaryUrl}): ${reason}; using endpoint-level fallback`,
		);
		return { snapshot: null, source: "unavailable", primaryUrl };
	}
}

export async function loadHomelabProbeSnapshot(): Promise<{
	snapshot: HomelabHealthSnapshot | null;
	source: "fastapi-probes" | "unavailable";
	primaryUrl: string;
}> {
	const primaryUrl = probesApiUrl();
	try {
		return {
			snapshot: await loadSnapshot(
				primaryUrl,
				PROBES_TIMEOUT_MS,
				"nabla-site-homelab-probes/2.0",
				"no-cache",
			),
			source: "fastapi-probes",
			primaryUrl,
		};
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[homelab-probes] FastAPI probe matrix unavailable (${primaryUrl}): ${reason}`,
		);
		return { snapshot: null, source: "unavailable", primaryUrl };
	}
}

export function homelabHealthForUrl(
	snapshot: HomelabHealthSnapshot | null,
	url?: string,
): HomelabHealthEntry | undefined {
	const normalized = normalizeHomelabHealthUrl(url);
	if (!snapshot || !normalized) return undefined;
	return snapshot.services.find(
		(entry) => normalizeHomelabHealthUrl(entry.url) === normalized,
	);
}
