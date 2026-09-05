export type RuntimeRedisEvidence = {
	backend?: string;
	provider_attribution?: string;
	telemetry_scope?: string;
	key_count_scope?: string;
	configured: boolean | null;
	available: boolean | null;
	telemetry_available: boolean | null;
	reason?: string;
	error_kind?: string;
	failure_stage?: string;
	exception_type?: string;
	used_memory_bytes?: number;
	used_memory_human?: string;
	used_memory_rss_bytes?: number;
	used_memory_rss_human?: string;
	used_memory_peak_bytes?: number;
	used_memory_peak_human?: string;
	maxmemory_bytes?: number;
	maxmemory_human?: string;
	maxmemory_policy?: string;
	memory_utilization_percent?: number;
	mem_fragmentation_ratio?: number;
	connected_clients?: number;
	blocked_clients?: number;
	keys?: number;
	instantaneous_ops_per_sec?: number;
	keyspace_hits?: number;
	keyspace_misses?: number;
	keyspace_hit_rate_percent?: number;
	evicted_keys?: number;
	expired_keys?: number;
};

export type RuntimeTopologyInstance = {
	id: string;
	last_seen_at?: string;
	egress_ip?: string | null;
	egress_observed?: boolean;
	egress_cached?: boolean;
};

export type RuntimeTopologySnapshot = {
	provider: string;
	runtime_mode?: string;
	observed_at: string;
	platform_replica_count?: number | null;
	platform_replica_count_available: boolean;
	count_semantics: string;
	heartbeat_interval_seconds?: number;
	active_window_seconds?: number;
	recent_egress_window_seconds?: number;
	observed_instance_count: number;
	instances: RuntimeTopologyInstance[];
	active_egress_ips: string[];
	recent_egress_ips: string[];
	aggregation?: string;
	degraded?: boolean;
	redis?: RuntimeRedisEvidence;
};

export const RUNTIME_TOPOLOGY_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/runtime/topology";

const PRIMARY_TIMEOUT_MS = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function optionalBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function parseRedisEvidence(value: unknown): RuntimeRedisEvidence | undefined {
	if (!isRecord(value)) return undefined;
	return {
		configured: optionalBoolean(value.configured),
		available: optionalBoolean(value.available),
		telemetry_available: optionalBoolean(value.telemetry_available),
		...(optionalString(value.backend) ? { backend: optionalString(value.backend) } : {}),
		...(optionalString(value.provider_attribution)
			? { provider_attribution: optionalString(value.provider_attribution) }
			: {}),
		...(optionalString(value.telemetry_scope)
			? { telemetry_scope: optionalString(value.telemetry_scope) }
			: {}),
		...(optionalString(value.key_count_scope)
			? { key_count_scope: optionalString(value.key_count_scope) }
			: {}),
		...(optionalString(value.reason) ? { reason: optionalString(value.reason) } : {}),
		...(optionalString(value.error_kind)
			? { error_kind: optionalString(value.error_kind) }
			: {}),
		...(optionalString(value.failure_stage)
			? { failure_stage: optionalString(value.failure_stage) }
			: {}),
		...(optionalString(value.exception_type)
			? { exception_type: optionalString(value.exception_type) }
			: {}),
		...Object.fromEntries(
			[
				"used_memory_bytes",
				"used_memory_rss_bytes",
				"used_memory_peak_bytes",
				"maxmemory_bytes",
				"memory_utilization_percent",
				"mem_fragmentation_ratio",
				"connected_clients",
				"blocked_clients",
				"keys",
				"instantaneous_ops_per_sec",
				"keyspace_hits",
				"keyspace_misses",
				"keyspace_hit_rate_percent",
				"evicted_keys",
				"expired_keys",
			]
				.map((key) => [key, optionalNumber(value[key])])
				.filter((entry): entry is [string, number] => entry[1] !== undefined),
		),
		...(optionalString(value.used_memory_human)
			? { used_memory_human: optionalString(value.used_memory_human) }
			: {}),
		...(optionalString(value.used_memory_rss_human)
			? { used_memory_rss_human: optionalString(value.used_memory_rss_human) }
			: {}),
		...(optionalString(value.used_memory_peak_human)
			? { used_memory_peak_human: optionalString(value.used_memory_peak_human) }
			: {}),
		...(optionalString(value.maxmemory_human)
			? { maxmemory_human: optionalString(value.maxmemory_human) }
			: {}),
		...(optionalString(value.maxmemory_policy)
			? { maxmemory_policy: optionalString(value.maxmemory_policy) }
			: {}),
	};
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

export function parseRuntimeTopology(value: unknown): RuntimeTopologySnapshot | null {
	if (!isRecord(value) || !Array.isArray(value.instances)) return null;
	if (
		typeof value.provider !== "string" ||
		typeof value.observed_at !== "string" ||
		typeof value.platform_replica_count_available !== "boolean" ||
		typeof value.count_semantics !== "string" ||
		typeof value.observed_instance_count !== "number" ||
		!Number.isInteger(value.observed_instance_count) ||
		value.observed_instance_count < 0
	) {
		return null;
	}
	const instances = value.instances.flatMap((raw) => {
		if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id.trim()) return [];
		return [
			{
				id: raw.id,
				...(typeof raw.last_seen_at === "string"
					? { last_seen_at: raw.last_seen_at }
					: {}),
				...(raw.egress_ip === null || typeof raw.egress_ip === "string"
					? { egress_ip: raw.egress_ip }
					: {}),
				...(typeof raw.egress_observed === "boolean"
					? { egress_observed: raw.egress_observed }
					: {}),
				...(typeof raw.egress_cached === "boolean"
					? { egress_cached: raw.egress_cached }
					: {}),
			},
		];
	});
	const redis = parseRedisEvidence(value.redis);
	return {
		provider: value.provider,
		...(optionalString(value.runtime_mode)
			? { runtime_mode: optionalString(value.runtime_mode) }
			: {}),
		observed_at: value.observed_at,
		platform_replica_count:
			value.platform_replica_count === null ||
			typeof value.platform_replica_count === "number"
				? value.platform_replica_count
				: undefined,
		platform_replica_count_available: value.platform_replica_count_available,
		count_semantics: value.count_semantics,
		heartbeat_interval_seconds:
			typeof value.heartbeat_interval_seconds === "number"
				? value.heartbeat_interval_seconds
				: undefined,
		active_window_seconds:
			typeof value.active_window_seconds === "number"
				? value.active_window_seconds
				: undefined,
		recent_egress_window_seconds:
			typeof value.recent_egress_window_seconds === "number"
				? value.recent_egress_window_seconds
				: undefined,
		observed_instance_count: value.observed_instance_count,
		instances,
		active_egress_ips: stringArray(value.active_egress_ips),
		recent_egress_ips: stringArray(value.recent_egress_ips),
		aggregation:
			typeof value.aggregation === "string" ? value.aggregation : undefined,
		degraded: typeof value.degraded === "boolean" ? value.degraded : undefined,
		...(redis ? { redis } : {}),
	};
}

export async function loadRuntimeTopology(): Promise<RuntimeTopologySnapshot | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);
	try {
		const response = await fetch(
			process.env.RUNTIME_TOPOLOGY_API_URL?.trim() ||
				RUNTIME_TOPOLOGY_DEFAULT_API_URL,
			{
				headers: { Accept: "application/json" },
				cache: "no-store",
				signal: controller.signal,
			},
		);
		if (!response.ok) return null;
		return parseRuntimeTopology(await response.json());
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
