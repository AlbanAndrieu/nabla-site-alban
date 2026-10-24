/**
 * Legacy v1 test-only fixtures. Do not import this module from application
 * code: current SERVICE and OWNER readers use Backstage v2 exclusively.
 */
import navigationOverrides from "../config/homelab-navigation-overrides.json";
import localCatalog from "../public/homelab-services.json";
import { isRecord } from "./guards";
import {
  homelabServiceId,
  type HomelabService,
  type HomelabServicesCatalog,
} from "./homelabServices";

const HOMELAB_DOMAIN = "albandrieu.com";

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
