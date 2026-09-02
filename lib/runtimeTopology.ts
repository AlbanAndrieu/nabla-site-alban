export type RuntimeTopologyInstance = {
	id: string;
	last_seen_at?: string;
	egress_ip?: string | null;
	egress_observed?: boolean;
	egress_cached?: boolean;
};

export type RuntimeTopologySnapshot = {
	provider: string;
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
};

export const RUNTIME_TOPOLOGY_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/runtime/topology";

const PRIMARY_TIMEOUT_MS = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
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
	return {
		provider: value.provider,
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
