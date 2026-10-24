import navigationOverrides from "../config/homelab-navigation-overrides.json";
import localCatalog from "../public/homelab-services.json";
import { isRecord } from "./guards";
import type { ServiceCriticalityLevel } from "./serviceCriticalityLevel";

const HOMELAB_DOMAIN = "albandrieu.com";
const SERVICE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Retain aliases for historical catalog IDs. DNS and container names are unchanged.
const CANONICAL_APP_IDS: Readonly<Record<string, string>> = {
  "home-assistant": "homeassistant",
  "open-webui": "openwebui",
};
const VERIFIED_WEB_UI_IDS = new Set([
  "bichon", "gatus", "homeassistant", "openwebui", "garage-webui",
]);

export type HomelabEnvironment = "production" | "staging" | "dev";

export type HomelabService = {
	id?: string;
	/** Canonical Backstage v2 identity, not a service URL. */
	entityRef?: string;
	name: string;
	environment?: HomelabEnvironment;
	kind?: string;
	category?: string;
	presentationRole?: "service" | "core" | "support";
	criticality?: ServiceCriticalityLevel;
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
	/** Required for correlating public service health with the matching catalog. */
	catalogRevision?: string;
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

export const HOMELAB_SERVICES_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/site/catalog/v2";

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
	const sourceId = explicitId && SERVICE_ID_RE.test(explicitId)
		? explicitId
		: slugifyServiceName(service.name);
	return CANONICAL_APP_IDS[sourceId] ?? sourceId;
}

/** Display an endpoint role without altering canonical IDs or DNS URLs. */
export function homelabServiceDisplayName(service: HomelabService): string {
	const name = service.name.trim();
	const id = homelabServiceId(service);
	const role = service.kind === "mcp-server" || id.startsWith("mcp-")
		? "MCP"
		: service.kind === "api" || id.endsWith("-api")
			? "API"
			: VERIFIED_WEB_UI_IDS.has(id) ? "UI" : null;
	if (!role || new RegExp(`\\b${role}import navigationOverrides from "../config/homelab-navigation-overrides.json";
import localCatalog from "../public/homelab-services.json";
import { isRecord } from "./guards";
import type { ServiceCriticalityLevel } from "./serviceCriticalityLevel";

const HOMELAB_DOMAIN = "albandrieu.com";
const SERVICE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Retain aliases for historical catalog IDs. DNS and container names are unchanged.
const CANONICAL_APP_IDS: Readonly<Record<string, string>> = {
  "home-assistant": "homeassistant",
  "open-webui": "openwebui",
};
const VERIFIED_WEB_UI_IDS = new Set([
  "bichon", "gatus", "homeassistant", "openwebui", "garage-webui",
]);

export type HomelabEnvironment = "production" | "staging" | "dev";

export type HomelabService = {
	id?: string;
	/** Canonical Backstage v2 identity, not a service URL. */
	entityRef?: string;
	name: string;
	environment?: HomelabEnvironment;
	kind?: string;
	category?: string;
	presentationRole?: "service" | "core" | "support";
	criticality?: ServiceCriticalityLevel;
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
	/** Required for correlating public service health with the matching catalog. */
	catalogRevision?: string;
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

export const HOMELAB_SERVICES_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/site/catalog/v2";

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
, "i").test(name)) return name;
	return `${name} ${role}`;
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
