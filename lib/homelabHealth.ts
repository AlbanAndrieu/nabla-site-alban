export type HomelabHealthState = "ok" | "warn" | "fail";

export type HomelabHealthEntry = {
	id?: string;
	name: string;
	url: string;
	reachable: boolean;
	http_status: number;
	state: HomelabHealthState;
	tls_trusted?: boolean | null;
	latency_ms?: number;
	error?: string;
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
	state: HomelabHealthState;
	latency_ms?: number;
	error?: string;
};

export type TrueNasHealth = {
	state: HomelabHealthState;
	public?: HomelabHealthEntry | null;
	internal?: HomelabInternalHealthEntry | null;
	internal_probe_enabled?: boolean;
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

const PRIMARY_TIMEOUT_MS = 2500;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHealthState(value: unknown): value is HomelabHealthState {
	return value === "ok" || value === "warn" || value === "fail";
}

export function normalizeHomelabHealthUrl(url?: string): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
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

function validHealthEntry(entry: unknown): entry is HomelabHealthEntry {
	if (!isRecord(entry)) return false;
	return (
		(entry.id === undefined || typeof entry.id === "string") &&
		typeof entry.name === "string" &&
		entry.name.trim().length > 0 &&
		typeof entry.url === "string" &&
		normalizeHomelabHealthUrl(entry.url) !== null &&
		typeof entry.reachable === "boolean" &&
		typeof entry.http_status === "number" &&
		Number.isFinite(entry.http_status) &&
		isHealthState(entry.state) &&
		validOptionalBoolean(entry.tls_trusted) &&
		validOptionalNumber(entry.latency_ms) &&
		(entry.error === undefined || typeof entry.error === "string") &&
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
		isHealthState(entry.state) &&
		validOptionalNumber(entry.latency_ms) &&
		(entry.error === undefined || typeof entry.error === "string")
	);
}

function validTrueNasHealth(value: unknown): value is TrueNasHealth {
	if (!isRecord(value) || !isHealthState(value.state)) return false;
	if (value.public !== undefined && value.public !== null && !validHealthEntry(value.public)) {
		return false;
	}
	if (
		value.internal !== undefined &&
		value.internal !== null &&
		!validInternalHealthEntry(value.internal)
	) {
		return false;
	}
	return validOptionalBoolean(value.internal_probe_enabled);
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

	if (!value.services.every(validHealthEntry)) return null;
	if (
		value.truenas !== undefined &&
		value.truenas !== null &&
		!validTrueNasHealth(value.truenas)
	) {
		return null;
	}
	if (!validOptionalBoolean(value.internal_probes_enabled)) return null;
	if (
		value.internal_services !== undefined &&
		(!Array.isArray(value.internal_services) ||
			!value.internal_services.every(validInternalHealthEntry))
	) {
		return null;
	}
	if (!validOptionalBoolean(value.truenas_runtime_reachable)) return null;
	if (!validOptionalBoolean(value.truenas_runtime_stale)) return null;
	if (!validOptionalBoolean(value.cloudflare_configured)) return null;
	if (!validOptionalNumber(value.cloudflare_tunnels_observed)) return null;

	return value as HomelabHealthSnapshot;
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
				"User-Agent": "nabla-site-homelab-health/3.0",
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
