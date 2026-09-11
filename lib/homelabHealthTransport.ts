import { parseHomelabHealthSnapshot } from "./homelabHealthParser";
import type {
	HomelabHealthSnapshot,
	HomelabHealthSource,
} from "./homelabHealthTypes";

export const HOMELAB_HEALTH_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab/health";
export const HOMELAB_PROBES_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab/probes";

const PRIMARY_TIMEOUT_MS = 8_000;
const PROBES_TIMEOUT_MS = 6_000;

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
