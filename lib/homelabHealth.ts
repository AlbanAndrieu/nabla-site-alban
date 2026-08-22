export type HomelabHealthState = "ok" | "warn" | "fail";

export type HomelabHealthEntry = {
	name: string;
	url: string;
	reachable: boolean;
	http_status: number;
	state: HomelabHealthState;
	tls_trusted?: boolean | null;
	latency_ms?: number;
	error?: string;
};

export type HomelabHealthSnapshot = {
	schema_version: number;
	checked_at: string;
	services: HomelabHealthEntry[];
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
		value.checked_at.trim().length === 0 ||
		value.services.length === 0
	) {
		return null;
	}

	for (const entry of value.services) {
		if (
			!isRecord(entry) ||
			typeof entry.name !== "string" ||
			entry.name.trim().length === 0 ||
			typeof entry.url !== "string" ||
			normalizeHomelabHealthUrl(entry.url) === null ||
			typeof entry.reachable !== "boolean" ||
			typeof entry.http_status !== "number" ||
			!Number.isFinite(entry.http_status) ||
			!isHealthState(entry.state)
		) {
			return null;
		}
		if (
			entry.tls_trusted !== undefined &&
			entry.tls_trusted !== null &&
			typeof entry.tls_trusted !== "boolean"
		) {
			return null;
		}
		if (
			entry.latency_ms !== undefined &&
			(typeof entry.latency_ms !== "number" ||
				!Number.isFinite(entry.latency_ms) ||
				entry.latency_ms < 0)
		) {
			return null;
		}
		if (entry.error !== undefined && typeof entry.error !== "string") {
			return null;
		}
	}

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
				"User-Agent": "nabla-site-homelab-health/1.0",
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
