import type { HomelabHealthEntry, HomelabHealthSnapshot } from "./homelabHealth";
import type { HomelabService } from "./homelabServices";

export type ObservedOwnerNavigation = {
  service: HomelabService;
  externalUrl: string;
  /** Did FastAPI actually observe or declare an HTTPS URL? */
  externalUrlDerived: boolean;
  internalProtocolObserved: boolean;
};

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function validUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username ||
        url.password || !url.hostname) return null;
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
    return a === 10 || a === 127 || a === 0 || a === 192 && b === 168 ||
      a === 172 && b >= 16 && b <= 31 || a === 169 && b === 254 ||
      a === 100 && b >= 64 && b <= 127;
  }
  return name.includes(":") || name.startsWith("fc") || name.startsWith("fd");
}

function validHost(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length < 256 &&
    /^(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])$/.test(value) &&
    !value.includes("..");
}

function observedEntry(
  service: HomelabService,
  snapshot: HomelabHealthSnapshot,
): HomelabHealthEntry | undefined {
  const id = service.id;
  const byId = snapshot.services.filter((entry) => entry.id && entry.id === id);
  if (byId.length === 1) return byId[0];
  if (byId.length !== 0) return undefined;
  const byName = snapshot.services.filter((entry) => normalized(entry.name) === normalized(service.name));
  return byName.length === 1 ? byName[0] : undefined;
}

/**
 * Runtime navigation belongs to the authorized OWNER observation.
 * The public catalog's endpointEnabled:false is intentional; never change it.
 * No synthetic hostname is created when a probe is missing.
 */
export function observedOwnerServiceNavigation(
  service: HomelabService,
  snapshot: HomelabHealthSnapshot | null,
): ObservedOwnerNavigation {
  if (!snapshot) {
    return { service, externalUrl: "", externalUrlDerived: false, internalProtocolObserved: false };
  }
  const observation = observedEntry(service, snapshot);
  const observedUrl = validUrl(observation?.url);
  const external = observedUrl && !isLanHost(observedUrl.hostname) ? observedUrl.href : "";
  const internalFromUrl = observedUrl && isLanHost(observedUrl.hostname) ? observedUrl : null;

  const idMatches = snapshot.internal_services?.filter((entry) => entry.id === service.id) ?? [];
  const nameMatches = idMatches.length ? [] : snapshot.internal_services?.filter(
    (entry) => normalized(entry.name) === normalized(service.name),
  ) ?? [];
  const internal = (idMatches.length === 1 ? idMatches[0] : undefined) ??
    (nameMatches.length === 1 ? nameMatches[0] : undefined);
  const internalHost = validHost(internal?.host) ? internal.host :
    internalFromUrl?.hostname;
  const internalPort = internal && Number.isInteger(internal.port) &&
    internal.port > 0 && internal.port <= 65535 ? internal.port :
    internalFromUrl ? Number(internalFromUrl.port || (internalFromUrl.protocol === "https:" ? "443" : "80")) : undefined;
  const hasInternal = Boolean(internalHost && internalPort && internalPort > 0 && internalPort <= 65535);

  return {
    externalUrl: external,
    externalUrlDerived: Boolean(external) && observation?.url_derived === true,
    internalProtocolObserved: Boolean(internalFromUrl),
    service: {
      ...service,
      endpointEnabled: Boolean(external),
      external: Boolean(external),
      tunnelSecure: Boolean(observation?.tunnel_status),
      ...(hasInternal ? {
        internalHost, internalPort,
        internalSecure: internalFromUrl?.protocol === "https:",
      } : {}),
    },
  };
}
