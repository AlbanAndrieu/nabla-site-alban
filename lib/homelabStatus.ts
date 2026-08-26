export type HomelabReconciliationState =
	| "in_sync"
	| "declared_only"
	| "observed_only"
	| "binding_conflict"
	| "runtime_unknown"
	| "not_observed";

export type HomelabObservedService = {
	appId?: string;
	appName?: string;
	appState?: string;
	version?: string;
	humanVersion?: string;
	upgradeAvailable?: boolean;
};

export type HomelabStatusService = {
	id: string;
	name: string;
	declared: boolean;
	reconciliation: HomelabReconciliationState;
	sourcePath?: string;
	composeService?: string;
	observed?: HomelabObservedService;
};

export type HomelabRuntimeSummary = {
	provider: "truenas";
	observed_at: string;
	configured: boolean;
	reachable: boolean;
	stale?: boolean;
	error?: string;
};

export type HomelabStatusSnapshot = {
	schemaVersion: number;
	checkedAt: string;
	catalogRevision: string;
	topologyVersion: number;
	runtime: HomelabRuntimeSummary;
	services: HomelabStatusService[];
	observedOnly: HomelabStatusService[];
};

export const HOMELAB_STATUS_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab/status";

const PRIMARY_TIMEOUT_MS = 2500;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isReconciliationState(value: unknown): value is HomelabReconciliationState {
	return (
		value === "in_sync" ||
		value === "declared_only" ||
		value === "observed_only" ||
		value === "binding_conflict" ||
		value === "runtime_unknown" ||
		value === "not_observed"
	);
}

function validStatusService(value: unknown): value is HomelabStatusService {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		value.id.length > 0 &&
		typeof value.name === "string" &&
		value.name.length > 0 &&
		typeof value.declared === "boolean" &&
		isReconciliationState(value.reconciliation) &&
		(value.observed === undefined || isRecord(value.observed))
	);
}

export function parseHomelabStatusSnapshot(value: unknown): HomelabStatusSnapshot | null {
	if (!isRecord(value) || !isRecord(value.runtime)) return null;
	if (!Array.isArray(value.services) || !Array.isArray(value.observedOnly)) return null;
	if (
		typeof value.schemaVersion !== "number" ||
		typeof value.checkedAt !== "string" ||
		typeof value.catalogRevision !== "string" ||
		typeof value.topologyVersion !== "number" ||
		value.runtime.provider !== "truenas" ||
		typeof value.runtime.observed_at !== "string" ||
		typeof value.runtime.configured !== "boolean" ||
		typeof value.runtime.reachable !== "boolean" ||
		(value.runtime.stale !== undefined && typeof value.runtime.stale !== "boolean") ||
		(value.runtime.error !== undefined && typeof value.runtime.error !== "string")
	) {
		return null;
	}
	if (!value.services.every(validStatusService) || !value.observedOnly.every(validStatusService)) {
		return null;
	}
	return value as HomelabStatusSnapshot;
}

function primaryApiUrl(): string {
	return process.env.HOMELAB_STATUS_API_URL?.trim() || HOMELAB_STATUS_DEFAULT_API_URL;
}

export async function loadHomelabStatusSnapshot(): Promise<{
	snapshot: HomelabStatusSnapshot | null;
	source: "fastapi" | "unavailable";
	primaryUrl: string;
}> {
	const primaryUrl = primaryApiUrl();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);
	try {
		const response = await fetch(primaryUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": "nabla-site-homelab-status/1.0",
			},
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const snapshot = parseHomelabStatusSnapshot(await response.json());
		if (!snapshot) throw new Error("Invalid homelab status payload");
		return { snapshot, source: "fastapi", primaryUrl };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(`[homelab-status] FastAPI status unavailable (${primaryUrl}): ${reason}`);
		return { snapshot: null, source: "unavailable", primaryUrl };
	} finally {
		clearTimeout(timeout);
	}
}
