import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabInternalHealthEntry,
} from "./homelabHealth";

type UnknownRecord = Record<string, unknown>;

const SERVICE_DIAGNOSTIC_KEYS = [
	"anonymous_http_status",
	"public_probe_auth_mode",
	"http_probe_auth_mode",
	"http_evidence_status",
	"http_evidence_skipped",
	"http_evidence_skip_reason",
	"cloudflare_http_evidence",
	"cloudflare_access_signal",
	"cloudflare_default_deny",
	"cloudflare_service_token_configured",
	"cloudflare_service_token_configuration_stage",
	"cloudflare_service_auth_attempted",
	"cloudflare_service_token_access_passed",
	"cloudflare_service_token_http_status",
	"cloudflare_service_token_default_deny",
	"cloudflare_service_token_access_signal",
	"cloudflare_service_token_error_kind",
	"probe_source",
	"probe_observed_at",
	"probe_age_seconds",
	"probe_stale",
	"probe_stale_after_seconds",
	"probe_interval_seconds",
	"next_probe_in_seconds",
	"probe_refresh_error",
	"timed_out",
	"error_kind",
	"latency_ms",
	"error",
	"application_error",
] as const;

const INTERNAL_DIAGNOSTIC_KEYS = [
	"probe_source",
	"probe_observed_at",
	"probe_age_seconds",
	"probe_stale",
	"probe_stale_after_seconds",
	"probe_interval_seconds",
	"next_probe_in_seconds",
	"probe_refresh_error",
	"timed_out",
	"error_kind",
	"latency_ms",
	"error",
] as const;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function copyAllowed(
	value: unknown,
	keys: readonly string[],
): Record<string, unknown> {
	if (!isRecord(value)) return {};
	const result: Record<string, unknown> = {};
	for (const key of keys) {
		const item = value[key];
		if (
			typeof item === "string" ||
			typeof item === "number" ||
			typeof item === "boolean" ||
			item === null
		) {
			result[key] = item;
		}
	}
	return result;
}

function normalizedName(value: unknown): string | null {
	return typeof value === "string" && value.trim()
		? value.trim().toLowerCase()
		: null;
}

function indexRows(rows: unknown): {
	byId: Map<string, UnknownRecord>;
	byName: Map<string, UnknownRecord>;
} {
	const byId = new Map<string, UnknownRecord>();
	const byName = new Map<string, UnknownRecord>();
	if (!Array.isArray(rows)) return { byId, byName };
	for (const row of rows) {
		if (!isRecord(row)) continue;
		if (typeof row.id === "string" && row.id.trim()) byId.set(row.id, row);
		const name = normalizedName(row.name);
		if (name) byName.set(name, row);
	}
	return { byId, byName };
}

function rawMatch(
	entry: HomelabHealthEntry | HomelabInternalHealthEntry,
	index: ReturnType<typeof indexRows>,
): UnknownRecord | undefined {
	if (entry.id && index.byId.has(entry.id)) return index.byId.get(entry.id);
	const name = normalizedName(entry.name);
	return name ? index.byName.get(name) : undefined;
}

/**
 * Keep the aggregate snapshot authoritative while retaining sanitized probe-only
 * evidence from /api/homelab/probes. The allow-list deliberately excludes
 * arbitrary provider payload fields and credential material.
 */
export function mergeHomelabProbeDiagnostics(
	aggregate: HomelabHealthSnapshot,
	probes: HomelabHealthSnapshot | null,
): HomelabHealthSnapshot {
	if (!probes) return aggregate;
	const rawProbes = probes as unknown as UnknownRecord;
	const serviceIndex = indexRows(rawProbes.services);
	const internalIndex = indexRows(rawProbes.internal_services);
	const probeRuntime = isRecord(rawProbes.probe_runtime)
		? rawProbes.probe_runtime
		: undefined;

	const services = aggregate.services.map((entry) => ({
		...copyAllowed(rawMatch(entry, serviceIndex), SERVICE_DIAGNOSTIC_KEYS),
		...entry,
	})) as HomelabHealthEntry[];
	const internalServices = aggregate.internal_services?.map((entry) => ({
		...copyAllowed(rawMatch(entry, internalIndex), INTERNAL_DIAGNOSTIC_KEYS),
		...entry,
	})) as HomelabInternalHealthEntry[] | undefined;

	return {
		...aggregate,
		...(probeRuntime ? { probe_runtime: probeRuntime } : {}),
		services,
		...(internalServices ? { internal_services: internalServices } : {}),
	} as HomelabHealthSnapshot;
}
