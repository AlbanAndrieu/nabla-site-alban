import type { HomelabHealthEntry, HomelabHealthSnapshot } from "./homelabHealth";
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

const EMPTY_SOURCE = {
  externalUrl: "",
  externalUrlDerived: false,
  internalProtocolObserved: false,
  internalTargetSource: "none",
  internalRouteMismatch: false,
} as const;

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function validUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") ||
        url.username || url.password || !url.hostname) return null;
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
  if (name === "localhost" || name.endsWith(".localhost") ||
      name.endsWith(".local") || name.endsWith(".int.albandrieu.com")) return true;
  const parts = name.split(".");
  if (parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && +part <= 255)) {
    const [a, b] = parts.map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
  }
  return name.includes(":");
}

function validHost(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length < 256 &&
    /^(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])$/.test(value) &&
    !value.includes("..");
}

function validPort(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 65535;
}

function portOf(url: URL): number {
  return Number(url.port || (url.protocol === "https:" ? 443 : 80));
}

function observedEntry(
  service: HomelabService,
  snapshot: HomelabHealthSnapshot,
): HomelabHealthEntry | undefined {
  const idMatches = snapshot.services.filter((entry) => entry.id === service.id);
  if (idMatches.length > 0) return idMatches.length === 1 ? idMatches[0] : undefined;
  const nameMatches = snapshot.services.filter((entry) =>
    normalized(entry.name) === normalized(service.name));
  return nameMatches.length === 1 ? nameMatches[0] : undefined;
}

/** OWNER only. Never add these fields to the Backstage public projection or localStorage. */
export function observedOwnerServiceNavigation(
  service: HomelabService,
  snapshot: HomelabHealthSnapshot | null,
): ObservedOwnerNavigation {
  if (!snapshot) return { service, ...EMPTY_SOURCE };

  const entry = observedEntry(service, snapshot);
  if (!entry) return { service, ...EMPTY_SOURCE };
  const declared = entry.exposure?.declared;
  const observed = entry.exposure?.observed;
  const configuredPublic = declared?.external === true ||
    (declared?.external !== false && entry.exposure_intent === "public");
  const enabled = declared?.endpoint_enabled !== false;
  const canonical = validUrl(entry.url);
  const externalUrl = configuredPublic && enabled && canonical &&
    !isLanHost(canonical.hostname) ? canonical.href : "";
  const internalFromUrl = canonical && isLanHost(canonical.hostname) ? canonical : null;

  const byId = snapshot.internal_services?.filter((row) => row.id === service.id) ?? [];
  const byName = byId.length ? [] : snapshot.internal_services?.filter((row) =>
    normalized(row.name) === normalized(service.name)) ?? [];
  const probe = (byId.length === 1 ? byId[0] : undefined) ??
    (byName.length === 1 ? byName[0] : undefined);
  const host = validHost(probe?.host) ? probe.host :
    validHost(declared?.internal_host) ? declared.internal_host :
      internalFromUrl?.hostname;
  const port = validPort(probe?.port) ? probe.port :
    validPort(declared?.internal_port) ? declared.internal_port :
      internalFromUrl ? portOf(internalFromUrl) : undefined;
  const hasInternal = Boolean(host && validPort(port) && isLanHost(host));

  const tunnelOrigin = validUrl(observed?.cloudflare_origin_service);
  const matchingOrigin = Boolean(
    hasInternal && tunnelOrigin &&
    tunnelOrigin.hostname.toLowerCase() === host?.toLowerCase().replace(/^\[|\]$/g, "") &&
    portOf(tunnelOrigin) === port &&
    observed?.cloudflare_origin_matches_topology === true
  );
  const internalRouteMismatch = Boolean(
    hasInternal && observed?.cloudflare_origin_matches_topology === false
  );

  const internalProtocol = internalFromUrl?.protocol ??
    (matchingOrigin ? tunnelOrigin?.protocol : undefined);
  // A configured URL is not evidence of a successful LAN probe.
  const source = !hasInternal ? "none" as const :
    probe ? "probe" as const : "declared" as const;

  return {
    service: {
      ...service,
      external: Boolean(externalUrl),
      endpointEnabled: Boolean(externalUrl),
      tunnelSecure: Boolean(externalUrl && entry.tunnel_status),
      ...(hasInternal ? {
        internalHost: host,
        internalPort: port,
        internalSecure: internalProtocol === "https:",
      } : {}),
    },
    externalUrl,
    externalUrlDerived: Boolean(externalUrl) && entry.url_derived === true,
    // A protocol inferred from a canonical URL is not a measured probe result.
    internalProtocolObserved: Boolean(internalProtocol && (probe || matchingOrigin)),
    internalTargetSource: source,
    internalRouteMismatch,
  };
}
