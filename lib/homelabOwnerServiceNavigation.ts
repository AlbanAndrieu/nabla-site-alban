import { catalogEntitySlug } from "./homelabCatalogV2Names.ts";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabInternalHealthEntry,
} from "./homelabHealth";
import type { HomelabService } from "./homelabServices";

export type ObservedOwnerNavigation = {
	service: HomelabService;
	externalUrl: string;
	externalUrlDerived: boolean;
	/** A known protocol from a matching direct probe or Cloudflare ingress. */
	internalProtocolObserved: boolean;
	internalTargetSource: "probe" | "declared" | "none";
	internalRouteMismatch: boolean;
};

/** OWNER-only indexes for one immutable FastAPI snapshot; never persist in SERVICE. */
export type OwnerNavigationIndex = {
	services: Map<string, HomelabHealthEntry>;
	internal: Map<string, HomelabInternalHealthEntry>;
};

/** Duplicate row IDs are intentionally omitted rather than arbitrarily selected. */
function uniqueById<T extends { id?: string }>(
	entries: readonly T[],
): Map<string, T> {
	const byId = new Map<string, T>();
	const ambiguous = new Set<string>();
	for (const entry of entries) {
		const id = entry.id;
		if (!id || ambiguous.has(id)) continue;
		if (byId.has(id)) {
			byId.delete(id);
			ambiguous.add(id);
		} else {
			byId.set(id, entry);
		}
	}
	return byId;
}

/** Linear pre-index for all cards in a page; removes repeated snapshot scans. */
export function indexOwnerNavigation(
	snapshot: HomelabHealthSnapshot,
): OwnerNavigationIndex {
	return {
		services: uniqueById(snapshot.services),
		internal: uniqueById(snapshot.internal_services ?? []),
	};
}

const EMPTY_SOURCE = {
	externalUrl: "",
	externalUrlDerived: false,
	internalProtocolObserved: false,
	internalTargetSource: "none",
	internalRouteMismatch: false,
} as const;

function validUrl(value: string | null | undefined): URL | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		if (
			(url.protocol !== "http:" && url.protocol !== "https:") ||
			url.username ||
			url.password ||
			!url.hostname
		)
			return null;
		// Probe URLs can contain auth tokens. The card only needs their destination.
		url.search = "";
		url.hash = "";
		return url;
	} catch {
		return null;
	}
}

function isLanHost(host: string): boolean {
	const name = host.toLowerCase().replace(/^\[|\]$/g, "");
	if (
		name === "localhost" ||
		name.endsWith(".localhost") ||
		name.endsWith(".local") ||
		name.endsWith(".int.albandrieu.com")
	)
		return true;
	const parts = name.split(".");
	if (
		parts.length === 4 &&
		parts.every((part) => /^\d{1,3}$/.test(part) && +part <= 255)
	) {
		const [a, b] = parts.map(Number);
		return (
			a === 10 ||
			a === 127 ||
			a === 0 ||
			(a === 192 && b === 168) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 169 && b === 254) ||
			(a === 100 && b >= 64 && b <= 127)
		);
	}
	return name.includes(":");
}

function validHost(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.length < 256 &&
		/^(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])$/.test(value) &&
		!value.includes("..")
	);
}

function validPort(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value > 0 &&
		value <= 65535
	);
}

function portOf(url: URL): number {
	return Number(url.port || (url.protocol === "https:" ? 443 : 80));
}

// OWNER rows are keyed by the entity's metadata.name slug, never by display name.
function ownerRowId(service: HomelabService): string {
	return catalogEntitySlug(service.entityRef ?? service.id ?? "");
}

function observedEntry(
	service: HomelabService,
	index: OwnerNavigationIndex,
): HomelabHealthEntry | undefined {
	const id = ownerRowId(service);
	return id ? index.services.get(id) : undefined;
}

/** OWNER only. Never add these fields to the Backstage public projection or localStorage. */
export function observedOwnerServiceNavigation(
	service: HomelabService,
	snapshot: HomelabHealthSnapshot | null,
	index?: OwnerNavigationIndex,
): ObservedOwnerNavigation {
	if (!snapshot) return { service, ...EMPTY_SOURCE };

	const ownerIndex = index ?? indexOwnerNavigation(snapshot);
	const entry = observedEntry(service, ownerIndex);
	if (!entry) return { service, ...EMPTY_SOURCE };
	const declared = entry.exposure?.declared;
	const observed = entry.exposure?.observed;
	const configuredPublic =
		declared?.external === true ||
		(declared?.external !== false && entry.exposure_intent === "public");
	const enabled = declared?.endpoint_enabled !== false;
	const canonical = validUrl(entry.url);
	const externalUrl =
		configuredPublic && enabled && canonical && !isLanHost(canonical.hostname)
			? canonical.href
			: "";
	const internalFromUrl =
		canonical && isLanHost(canonical.hostname) ? canonical : null;

	const probe = ownerIndex.internal.get(entry.id ?? "");
	const host = validHost(probe?.host)
		? probe.host
		: validHost(declared?.internal_host)
			? declared.internal_host
			: internalFromUrl?.hostname;
	const port = validPort(probe?.port)
		? probe.port
		: validPort(declared?.internal_port)
			? declared.internal_port
			: internalFromUrl
				? portOf(internalFromUrl)
				: undefined;
	const hasInternal = Boolean(host && validPort(port) && isLanHost(host));

	const tunnelOrigin = validUrl(observed?.cloudflare_origin_service);
	const matchingOrigin = Boolean(
		hasInternal &&
			tunnelOrigin &&
			tunnelOrigin.hostname.toLowerCase() ===
				host?.toLowerCase().replace(/^\[|\]$/g, "") &&
			portOf(tunnelOrigin) === port &&
			observed?.cloudflare_origin_matches_topology === true,
	);
	const internalRouteMismatch = Boolean(
		hasInternal && observed?.cloudflare_origin_matches_topology === false,
	);

	const internalProtocol =
		internalFromUrl?.protocol ??
		(matchingOrigin ? tunnelOrigin?.protocol : undefined);
	// A configured URL is not evidence of a successful LAN probe.
	const source = !hasInternal
		? ("none" as const)
		: probe
			? ("probe" as const)
			: ("declared" as const);

	return {
		service: {
			...service,
			external: Boolean(externalUrl),
			endpointEnabled: Boolean(externalUrl),
			tunnelSecure: Boolean(externalUrl && entry.tunnel_status),
			...(hasInternal
				? {
						internalHost: host,
						internalPort: port,
						internalSecure: internalProtocol === "https:",
					}
				: {}),
		},
		externalUrl,
		externalUrlDerived: Boolean(externalUrl) && entry.url_derived === true,
		// A protocol inferred from a canonical URL is not a measured probe result.
		internalProtocolObserved: Boolean(
			internalProtocol && (probe || matchingOrigin),
		),
		internalTargetSource: source,
		internalRouteMismatch,
	};
}
