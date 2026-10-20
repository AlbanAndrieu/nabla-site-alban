import { projectHomelabCatalogV2 } from "./homelabCatalogV2Projection";
import { fetchSiteCatalogV2, SITE_CATALOG_V2_URL } from "./homelabSiteCatalog";
import type { ServiceTopology } from "./serviceTopology";
import navigationOverrides from "../config/homelab-navigation-overrides.json";
import localCatalog from "../public/homelab-services.json";

const HOMELAB_DOMAIN = "albandrieu.com";
const SERVICE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type HomelabEnvironment = "production" | "staging" | "dev";

export type HomelabService = {
	id?: string;
	name: string;
	environment?: HomelabEnvironment;
	kind?: string;
	category?: string;
	presentationRole?: "service" | "core" | "support";
	criticality?: "critical" | "high" | "medium" | "low";
	description?: string;
	healthNote?: string;
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
	/** Sanitized owner-only fallback reason; never include credentials. */
	privateInventoryStatus?: "key-missing" | "access-denied" | "unavailable";
	services: HomelabService[];
	[key: string]: unknown;
};

export type HomelabServicesSource = "fastapi" | "local-fallback";

/** The sole public fallback is a non-operational placeholder, not a catalog. */
export function isHomelabCatalogPlaceholder(
	catalog: HomelabServicesCatalog,
): boolean {
	return (
		catalog.services.length === 1 &&
		catalog.services[0]?.id === "homelab" &&
		catalog.services[0]?.endpointEnabled === false
	);
}

export const HOMELAB_SERVICES_DEFAULT_API_URL = SITE_CATALOG_V2_URL;

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
 * Resolve legacy single-environment metadata.
 *
 * Deployment environments are owned by nabla-compose x-nabla.environments and
 * consumed through service-topology. This helper is only the fallback for
 * presentation-catalog entries that do not have topology environments.
 */
export function homelabServiceEnvironment(
	service: HomelabService,
): HomelabEnvironment {
	return service.environment ?? "production";
}

const NAVIGATION_ENDPOINT_OVERRIDES = new Map<string, string>(
	Object.entries(navigationOverrides),
);

/**
 * Return the URL the user should open.
 *
 * endpointUrl is deliberately distinct from tunnelUrl: pfSense/TrueNAS are
 * published on explicit ports even while FastAPI/Cloudflare evidence keeps a
 * host-only tunnel identity.
 */
export function homelabServiceEndpointUrl(service: HomelabService): string {
	const navigation = service.endpointUrl?.trim();
	if (navigation) return navigation;

	const override = NAVIGATION_ENDPOINT_OVERRIDES.get(homelabServiceId(service));
	if (override) return override;

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
				(service.environment === undefined ||
					["production", "staging", "dev"].includes(
						String(service.environment),
					)) &&
				(service.endpointUrl === undefined ||
					typeof service.endpointUrl === "string") &&
				(service.endpointEnabled === undefined ||
					typeof service.endpointEnabled === "boolean") &&
				(service.healthNote === undefined ||
					typeof service.healthNote === "string") &&
				(service.presentationRole === undefined ||
					["service", "core", "support"].includes(
						String(service.presentationRole),
					)) &&
				(service.criticality === undefined ||
					["critical", "high", "medium", "low"].includes(
						String(service.criticality),
					)),
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
	LOCAL_FALLBACK.services.map((service) => [
		homelabServiceId(service),
		service,
	]),
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
			const serviceId = homelabServiceId(service);
			const local = LOCAL_PRESENTATION_BY_ID.get(serviceId);
			const endpointUrl =
				NAVIGATION_ENDPOINT_OVERRIDES.get(serviceId) ?? local?.endpointUrl;
			if (!endpointUrl) return service;
			return { ...service, endpointUrl };
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
		catalog: applyLocalPresentationOverrides(LOCAL_FALLBACK),
		source: "local-fallback",
		primaryUrl: primaryApiUrl(),
	};
}

/** Strict Backstage v2 SERVICE consumer. No legacy or local-fallback read. */
export async function loadHomelabServicesCatalog(): Promise<{
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	source: HomelabServicesSource;
	primaryUrl: string;
}> {
	const v2 = await fetchSiteCatalogV2();
	const projected = projectHomelabCatalogV2(v2);
	return {
		catalog: projected.services,
		topology: projected.topology,
		source: "fastapi",
		primaryUrl: SITE_CATALOG_V2_URL,
	};
}
