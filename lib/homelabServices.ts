import localCatalog from "../public/homelab-services.json";

export type HomelabService = {
	name: string;
	description?: string;
	iconSrc?: string;
	tunnelUrl?: string;
	endpointEnabled?: boolean;
	internalHost?: string;
	internalPort?: number;
	internalSecure?: boolean;
	external?: boolean;
	[key: string]: unknown;
};

export type HomelabServicesCatalog = {
	version?: number;
	services: HomelabService[];
	[key: string]: unknown;
};

export type HomelabServicesSource = "fastapi" | "local-fallback";

export const HOMELAB_SERVICES_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab-services";

const PRIMARY_TIMEOUT_MS = 2500;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseHomelabServicesCatalog(
	value: unknown,
): HomelabServicesCatalog | null {
	if (!isRecord(value) || !Array.isArray(value.services)) {
		return null;
	}
	if (value.services.length === 0) {
		return null;
	}
	if (
		value.version !== undefined &&
		(typeof value.version !== "number" || !Number.isFinite(value.version))
	) {
		return null;
	}
	if (
		!value.services.every(
			(service) =>
				isRecord(service) &&
				typeof service.name === "string" &&
				service.name.trim().length > 0,
		)
	) {
		return null;
	}
	return value as HomelabServicesCatalog;
}

const LOCAL_FALLBACK = parseHomelabServicesCatalog(localCatalog);
if (!LOCAL_FALLBACK) {
	throw new Error("Invalid local homelab-services.json fallback");
}

function primaryApiUrl(): string {
	return (
		process.env.HOMELAB_SERVICES_API_URL?.trim() ||
		HOMELAB_SERVICES_DEFAULT_API_URL
	);
}

export async function loadHomelabServicesCatalog(): Promise<{
	catalog: HomelabServicesCatalog;
	source: HomelabServicesSource;
	primaryUrl: string;
}> {
	const primaryUrl = primaryApiUrl();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);

	try {
		const response = await fetch(primaryUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": "nabla-site-homelab-catalog/1.0",
			},
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const catalog = parseHomelabServicesCatalog(await response.json());
		if (!catalog) {
			throw new Error("Invalid homelab catalog payload");
		}
		return { catalog, source: "fastapi", primaryUrl };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[homelab-services] FastAPI catalog unavailable (${primaryUrl}): ${reason}; using local fallback`,
		);
		return {
			catalog: LOCAL_FALLBACK,
			source: "local-fallback",
			primaryUrl,
		};
	} finally {
		clearTimeout(timeout);
	}
}
