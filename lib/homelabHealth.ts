export type VerifiedHomelabHealthState = "ok" | "warn" | "fail";
export type HomelabHealthState = VerifiedHomelabHealthState | "unknown";

export type HomelabDependencyEvidence = {
	target: string;
	target_name?: string;
	relation_type: string;
	target_state: HomelabHealthState;
	evidence: string[];
	description?: string;
};

export type HomelabHealthEntry = {
	id?: string;
	name: string;
	url: string;
	url_derived?: boolean;
	reachable: boolean;
	http_status: number;
	state: HomelabHealthState;
	local_state?: HomelabHealthState;
	dependency_state?: HomelabHealthState | null;
	effective_state?: HomelabHealthState;
	required_dependencies?: string[];
	blocked_by?: string[];
	dependency_evidence?: HomelabDependencyEvidence[];
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
};

export type HomelabInternalHealthEntry = {
	name: string;
	host: string;
	port: number;
	reachable: boolean;
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

export type HomelabHealthSnapshot = {
	schema_version: number;
	checked_at: string;
	services: HomelabHealthEntry[];
	truenas?: TrueNasHealth | null;
	internal_probes_enabled?: boolean;
	internal_services?: HomelabInternalHealthEntry[];
	truenas_runtime_reachable?: boolean;
	truenas_runtime_stale?: boolean;
	cloudflare_configured?: boolean;
	cloudflare_tunnels_observed?: number;
};

export type HomelabHealthSource = "fastapi" | "unavailable";

export const HOMELAB_HEALTH_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab/health";

// FastAPI may spend up to five seconds on a cold TrueNAS/internal probe before
// returning the cached multi-source snapshot. Keep the proxy timeout above that
// ceiling so the richer runtime evidence is not discarded at 2.5 seconds.
const PRIMARY_TIMEOUT_MS = 8_000;

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

function isVerifiedHealthState(
	value: unknown,
): value is VerifiedHomelabHealthState {
	return value === "ok" || value === "warn" || value === "fail";
}

export function normalizeHomelabHealthUrl(url?: string): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
			return null;
		parsed.hash = "";
		return parsed.href;
	} catch {
		return null;
	}
}

function validOptionalBoolean(value: unknown): boolean {
	return value === undefined || value === null || typeof value === "boolean";
}

function validOptionalNumber(value: unknown): boolean {
	return (
		value === undefined ||
		(typeof value === "number" && Number.isFinite(value) && value >= 0)
	);
}

function validOptionalString(value: unknown): boolean {
	return value === undefined || value === null || typeof value === "string";
}

function validOptionalHealthState(value: unknown): boolean {
	return value === undefined || value === null || isHealthState(value);
}

function validOptionalStringArray(value: unknown): boolean {
	return (
		value === undefined ||
		(Array.isArray(value) &&
			value.every(
				(item) => typeof item === "string" && item.trim().length > 0,
			))
	);
}

function validDependencyEvidence(value: unknown): boolean {
	if (value === undefined) return true;
	if (!Array.isArray(value)) return false;
	return value.every(
		(item) =>
			isRecord(item) &&
			typeof item.target === "string" &&
			item.target.trim().length > 0 &&
			(item.target_name === undefined || typeof item.target_name === "string") &&
			typeof item.relation_type === "string" &&
			item.relation_type.trim().length > 0 &&
			isHealthState(item.target_state) &&
			Array.isArray(item.evidence) &&
			item.evidence.every(
				(evidence) =>
					typeof evidence === "string" && evidence.trim().length > 0,
			) &&
			(item.description === undefined || typeof item.description === "string"),
	);
}

function validHealthEntry(entry: unknown): entry is HomelabHealthEntry {
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
		validDependencyEvidence(entry.dependency_evidence) &&
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
		validOptionalBoolean(entry.runtime_reachable)
	);
}

function validInternalHealthEntry(
	entry: unknown,
): entry is HomelabInternalHealthEntry {
	if (!isRecord(entry)) return false;
	return (
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

function validTrueNasApiHealth(value: unknown): value is TrueNasApiHealth {
	if (!isRecord(value) || typeof value.reachable !== "boolean") return false;
	return value.error === undefined || typeof value.error === "string";
}

function validTrueNasHealth(value: unknown): value is TrueNasHealth {
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

export function parseHomelabHealthSnapshot(
	value: unknown,
): HomelabHealthSnapshot | null {
	if (!isRecord(value) || !Array.isArray(value.services)) {
		return null;
	}
	if (
		typeof value.schema_version !== "number" ||
		!Number.isFinite(value.schema_version) ||
		typeof value.checked_at !== "string" ||
		value.checked_at.trim().length === 0
	) {
		return null;
	}

	// Fail soft at row level. A malformed catalog URL or stale optional service
	// must not discard valid TrueNAS/Garage/runtime evidence for the whole board.
	const services = value.services.filter(validHealthEntry);
	if (
		value.truenas !== undefined &&
		value.truenas !== null &&
		!validTrueNasHealth(value.truenas)
	) {
		return null;
	}
	if (!validOptionalBoolean(value.internal_probes_enabled)) return null;
	let internalServices: HomelabInternalHealthEntry[] | undefined;
	if (value.internal_services !== undefined) {
		if (!Array.isArray(value.internal_services)) return null;
		internalServices = value.internal_services.filter(validInternalHealthEntry);
	}
	if (!validOptionalBoolean(value.truenas_runtime_reachable)) return null;
	if (!validOptionalBoolean(value.truenas_runtime_stale)) return null;
	if (!validOptionalBoolean(value.cloudflare_configured)) return null;
	if (!validOptionalNumber(value.cloudflare_tunnels_observed)) return null;

	return {
		...value,
		services,
		...(internalServices === undefined
			? {}
			: { internal_services: internalServices }),
	} as HomelabHealthSnapshot;
}

function primaryApiUrl(): string {
	return (
		process.env.HOMELAB_HEALTH_API_URL?.trim() || HOMELAB_HEALTH_DEFAULT_API_URL
	);
}

export async function loadHomelabHealthSnapshot(): Promise<{
	snapshot: HomelabHealthSnapshot | null;
	source: HomelabHealthSource;
	primaryUrl: string;
}> {
	const primaryUrl = primaryApiUrl();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);

	try {
		const response = await fetch(primaryUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": "nabla-site-homelab-health/5.0",
			},
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const snapshot = parseHomelabHealthSnapshot(await response.json());
		if (!snapshot) {
			throw new Error("Invalid homelab health payload");
		}
		return { snapshot, source: "fastapi", primaryUrl };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[homelab-health] FastAPI snapshot unavailable (${primaryUrl}): ${reason}; using endpoint-level fallback`,
		);
		return { snapshot: null, source: "unavailable", primaryUrl };
	} finally {
		clearTimeout(timeout);
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
