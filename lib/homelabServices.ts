import { catalogEntitySlug } from "./homelabCatalogV2Names";
import type { ServiceCriticalityLevel } from "./serviceCriticalityLevel";

const SERVICE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Historical service IDs are aliases. Do not rename containers or DNS hosts.
const CANONICAL_APP_IDS: Readonly<Record<string, string>> = {
	"home-assistant": "homeassistant",
	"open-webui": "openwebui",
};
const VERIFIED_WEB_UI_IDS = new Set([
	"bichon",
	"gatus",
	"homeassistant",
	"openwebui",
	"garage-webui",
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
	services: HomelabService[];
	[key: string]: unknown;
};

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

/**
 * Canonical identity: the full Backstage entity ref. Only OWNER probe rows,
 * which carry no entity ref, fall back to their FastAPI slug.
 */
export function homelabServiceId(service: HomelabService): string {
	if (typeof service.entityRef === "string" && service.entityRef)
		return service.entityRef;
	const explicitId = service.id?.trim();
	const sourceId =
		explicitId && SERVICE_ID_RE.test(explicitId)
			? explicitId
			: slugifyServiceName(service.name);
	return CANONICAL_APP_IDS[sourceId] ?? sourceId;
}

/** Show a verified endpoint role without changing canonical service identities. */
export function homelabServiceDisplayName(service: HomelabService): string {
	const name = service.name.trim();
	const id = catalogEntitySlug(homelabServiceId(service));
	const role =
		service.kind === "mcp-server" || id.startsWith("mcp-")
			? "MCP"
			: service.kind === "api" || id.endsWith("-api")
				? "API"
				: VERIFIED_WEB_UI_IDS.has(id)
					? "UI"
					: null;
	if (
		!role ||
		new RegExp(`\\b${role}$`, "i").test(name) ||
		(role === "UI" && /Web\s?UI$/i.test(name))
	)
		return name;
	return `${name} ${role}`;
}
