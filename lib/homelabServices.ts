import localCatalog from "../public/homelab-services.json";

const HOMELAB_DOMAIN = "albandrieu.com";
const SERVICE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type HomelabService = {
	id?: string;
	name: string;
	description?: string;
	icon?: string;
	iconSrc?: string;
	/** Browser navigation target. May intentionally differ from tunnelUrl. */
	endpointUrl?: string;
	tunnelUrl?: string;
	tunnelSecure?: boolean;
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

function slugifyServiceName(name: string): string {
	return (
		name
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "service"
	);
}

/** Return the same stable identity used by the FastAPI homelab contract. */
export function homelabServiceId(service: HomelabService): string {
	const explicitId = service.id?.trim();
	return explicitId && SERVICE_ID_RE.test(explicitId)
		? explicitId
		: slugifyServiceName(service.name);
}

/**
 * Return the URL the user should open.
 *
 * endpointUrl is deliberately distinct from tunnelUrl: pfSense/TrueNAS can be
 * reached on explicit published ports even when Cloudflare/tunnel metadata uses
 * a host-only identity for health evidence.
 */
export function homelabServiceEndpointUrl(service: HomelabService): string {
	const navigation = service.endpointUrl?.trim();
	if (navigation) return navigation;

	const explicit = service.tunnelUrl?.trim();
	if (explicit) return explicit;

	return `https://${homelabServiceId(service)}.${HOMELAB_DOMAIN}`;
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
				service.name.trim().length > 0 &&
				(service.id === undefined || typeof service.id === "string") &&
				(service.endpointUrl === undefined ||
					typeof service.endpointUrl === "string"),
		)
	) {
		return null;
	}
	return value as HomelabServicesCatalog;
}

function requireLocalFallback(): HomelabServicesCatalog {
	const catalog = parseHomelabServicesCatalog(localCatalog);
	if (!catalog) {
		throw new Error("Invalid local homelab-services.json fallback");
	}
	return catalog;
}

const LOCAL_FALLBACK = requireLocalFallback();
const LOCAL_PRESENTATION_BY_ID = new Map(
	LOCAL_FALLBACK.services.map((service) => [homelabServiceId(service), service]),
);

/**
 * Keep operational inventory/status authoritative in FastAPI while allowing the
 * site to own browser-navigation details such as explicit published ports.
 */
function applyLocalPresentationOverrides(
	catalog: HomelabServicesCatalog,
): HomelabServicesCatalog {
	return {
		...catalog,
		services: catalog.services.map((service) => {
			const local = LOCAL_PRESENTATION_BY_ID.get(homelabServiceId(service));
			if (!local?.endpointUrl) return service;
			return { ...service, endpointUrl: local.endpointUrl };
		}),
	};
}

function primaryApiUrl(): string {
	return (
		process.env.HOMELAB_SERVICES_API_URL?.trim() ||
		HOMELAB_SERVICES_DEFAULT_API_URL
	);
}

export function getStaticHomelabServicesCatalog(): {
	catalog: HomelabServicesCatalog;
	source: "local-fallback";
	primaryUrl: string;
} {
	return {
		catalog: LOCAL_FALLBACK,
		source: "local-fallback",
		primaryUrl: primaryApiUrl(),
	};
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
		return {
			catalog: applyLocalPresentationOverrides(catalog),
			source: "fastapi",
			primaryUrl,
		};
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
