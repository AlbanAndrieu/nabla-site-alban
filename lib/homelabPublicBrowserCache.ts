import type { HomelabServicesCatalog } from "./homelabServices";
import type { ServiceTopology } from "./serviceTopology";
import type { SiteHealthV2 } from "./siteHealthV2";
import { isSafePublicServiceId, isSafePublicText } from "./homelabPublicTextSafety";

/** Public SERVICE projections only. OWNER snapshots must never enter browser storage. */
const CATALOG_KEY = "nabla:homelab:catalog-public-v2:3";
const LEGACY_CATALOG_KEY = "nabla:homelab:catalog-public-v2:2";
const OLD_CATALOG_KEY = "nabla:homelab:catalog-public-v2:1";
const HEALTH_KEY = "nabla:homelab:health-public-v2:1";
// Public-only metadata remains useful during a prolonged TrueNAS outage.
// Cached health retains its short TTL and can never display old green states.
const CATALOG_TTL_MS = 24 * 60 * 60_000;
const PREVIOUS_CATALOG_TTL_MS = 15 * 60_000;
const HEALTH_TTL_MS = 2 * 60_000;
const REVISION = /^sha256:[0-9a-f]{64}$/;
const ENTITY_REF = /^(component|resource|api):[a-z0-9._-]+\/[a-z0-9._-]+$/;
const ICON = /^assets\/selfh-icons\/[a-zA-Z0-9._-]+\.(?:png|jpg|svg)$/;
const STATES = new Set(["ok", "warn", "fail", "unknown"]);
const RELATIONS = new Set([
	"dependsOn", "consumesApi", "providesApi", "partOf", "hostedBy",
	"routesTo", "observedBy", "storesIn", "authenticatesVia", "exposedBy", "automates",
]);
const MAX_BYTES = 512 * 1024;
const MAX_SERVICES = 2000;
const MAX_RELATIONS_PER_SERVICE = 6;
export const CATALOG_REVALIDATION_MS = 5 * 60_000;

type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type CatalogCache = { catalog: HomelabServicesCatalog; topology: ServiceTopology | null };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function localCatalog(value: HomelabServicesCatalog, topology: ServiceTopology | null): CatalogCache | null {
	if (!isRecord(value) || value.version !== 2 || typeof value.catalogRevision !== "string" ||
		!REVISION.test(value.catalogRevision) || !Array.isArray(value.services) ||
		value.services.length === 0 || value.services.length > MAX_SERVICES) return null;
	const names = new Set<string>();
	const refs = new Set<string>();
	const services: HomelabServicesCatalog["services"] = [];
	for (const service of value.services) {
		if (!service || typeof service !== "object" || !isSafePublicServiceId(service.id) || names.has(service.id) ||
			!isSafePublicText(service.name, 150) ||
			typeof service.entityRef !== "string" || !ENTITY_REF.test(service.entityRef) || refs.has(service.entityRef) ||
			(service.iconSrc !== undefined &&
				(typeof service.iconSrc !== "string" || !ICON.test(service.iconSrc))) ||
			service.endpointEnabled !== false) return null;
		names.add(service.id);
		refs.add(service.entityRef);
		services.push({
			id: service.id, name: service.name, entityRef: service.entityRef,
			endpointEnabled: false,
			...(isSafePublicText(service.description) ? { description: service.description } : {}),
			...(isSafePublicText(service.kind, 80) ? { kind: service.kind } : {}),
			...(isSafePublicText(service.category, 80) ? { category: service.category } : {}),
			...(["critical", "high", "medium", "low"].includes(service.criticality ?? "")
				? { criticality: service.criticality } : {}),
		});
	}
	let safeTopology: ServiceTopology | null = null;
	if (topology && topology.version === 2 && topology.catalogRevision === value.catalogRevision &&
		Array.isArray(topology.nodes) && Array.isArray(topology.relations) &&
		topology.nodes.length === names.size && topology.relations.length <= names.size * MAX_RELATIONS_PER_SERVICE &&
		topology.nodes.every((n) => n && typeof n === "object" && names.has(n.id) && isSafePublicText(n.name, 150) &&
			isSafePublicText(n.kind, 80) && isSafePublicText(n.category, 80)) &&
		new Set(topology.nodes.map((n) => n.id)).size === names.size &&
		topology.relations.every((r) => r && typeof r === "object" && names.has(r.source) && names.has(r.target) &&
			RELATIONS.has(r.type) && ["required", "optional"].includes(r.strength))) {
		safeTopology = {
			version: 2, catalogRevision: value.catalogRevision,
			name: "Nabla Backstage v2 (offline)",
			nodes: topology.nodes.map((n) => ({
				id: n.id, name: n.name.slice(0, 150), kind: n.kind.slice(0, 80),
				category: n.category.slice(0, 80),
				...(["critical", "high", "medium", "low"].includes(n.criticality ?? "")
					? { criticality: n.criticality } : {}),
			})),
			relations: topology.relations.map((r) => ({
				source: r.source, target: r.target, type: r.type,
				strength: r.strength, evidence: [],
			})),
		};
	}
	return { catalog: { version: 2, catalogRevision: value.catalogRevision, services }, topology: safeTopology };
}

/** Validate and narrow a live SERVICE response before it can enter public React state. */
export function parsePublicHomelabCatalogPayload(payload: unknown): CatalogCache | null {
	if (!isRecord(payload)) return null;
	return localCatalog(
		payload as HomelabServicesCatalog,
		isRecord(payload.topology) ? payload.topology as ServiceTopology : null,
	);
}

function put(storage: StoragePort, key: string, value: unknown, ttl: number, now: number): boolean {
	try {
		const json = JSON.stringify({ schema: 1, savedAt: now, expiresAt: now + ttl, data: value });
		if (json.length > MAX_BYTES) return false;
		storage.setItem(key, json);
		return true;
	} catch { return false; } // Storage can be disabled, private, or full.
}

function get(storage: StoragePort, key: string, ttl: number, now: number,
	previousTtl: number | null = null): unknown {
	try {
		const raw = storage.getItem(key);
		if (!raw) return null;
		if (raw.length > MAX_BYTES) { storage.removeItem(key); return null; }
		const envelope: unknown = JSON.parse(raw);
		const duration = isRecord(envelope) &&
			typeof envelope.savedAt === "number" &&
			typeof envelope.expiresAt === "number"
			? envelope.expiresAt - envelope.savedAt : NaN;
		// The same sanitized v3 catalog was previously stored with 15-minute TTL.
		// Allow its ORIGINAL savedAt for at most 24 hours; do not extend it on read.
		if (!isRecord(envelope) || envelope.schema !== 1 ||
			typeof envelope.savedAt !== "number" || typeof envelope.expiresAt !== "number" ||
			envelope.savedAt > now || envelope.savedAt + ttl <= now ||
			(duration !== ttl && duration !== previousTtl)) {
			storage.removeItem(key);
			return null;
		}
		return envelope.data;
	} catch { return null; }
}

export function writePublicCatalogCache(
	storage: StoragePort, catalog: HomelabServicesCatalog, topology: ServiceTopology | null,
	now = Date.now(),
): boolean {
	const projected = localCatalog(catalog, topology);
	if (!projected || !put(storage, CATALOG_KEY, projected, CATALOG_TTL_MS, now)) return false;
	// Free storage quota after deployment of a new icon contract.
	for (const key of [LEGACY_CATALOG_KEY, OLD_CATALOG_KEY]) {
		try { storage.removeItem(key); } catch { /* Storage may be disabled. */ }
	}
	return true;
}

export function readPublicCatalogCache(storage: StoragePort, now = Date.now()): CatalogCache | null {
	const raw = get(storage, CATALOG_KEY, CATALOG_TTL_MS, now, PREVIOUS_CATALOG_TTL_MS);
	if (!isRecord(raw) || !isRecord(raw.catalog)) return null;
	return localCatalog(raw.catalog as HomelabServicesCatalog,
		isRecord(raw.topology) ? raw.topology as ServiceTopology : null);
}

export function writePublicHealthCache(storage: StoragePort, health: SiteHealthV2, now = Date.now()): boolean {
	if (health.schemaVersion !== 2 || health.model !== "backstage-health" ||
		health.boardState !== "fresh" || !REVISION.test(health.catalogRevision) ||
		!Array.isArray(health.services) || health.services.length > MAX_SERVICES ||
		!health.services.every((s) => s && typeof s.entityRef === "string" &&
			ENTITY_REF.test(s.entityRef) && STATES.has(s.state))) return false;
	const refs = new Set(health.services.map((s) => s.entityRef));
	if (refs.size !== health.services.length) return false;
	const safe: SiteHealthV2 = {
		schemaVersion: 2, model: "backstage-health", catalogRevision: health.catalogRevision,
		boardState: "fresh", services: health.services.map((s) => ({ entityRef: s.entityRef, state: s.state })),
	};
	return put(storage, HEALTH_KEY, safe, HEALTH_TTL_MS, now);
}

/** Never replay a cached green state: last-known data renders UNKNOWN until refreshed. */
export function readStalePublicHealthCache(
	storage: StoragePort, catalogRevision: string, now = Date.now(),
): SiteHealthV2 | null {
	if (!REVISION.test(catalogRevision)) return null;
	const raw = get(storage, HEALTH_KEY, HEALTH_TTL_MS, now);
	if (!isRecord(raw) || raw.schemaVersion !== 2 || raw.model !== "backstage-health" ||
		!REVISION.test(String(raw.catalogRevision)) ||
		raw.catalogRevision !== catalogRevision ||
		!Array.isArray(raw.services) || raw.services.length > MAX_SERVICES) return null;
	const seen = new Set<string>();
	const services: SiteHealthV2["services"] = [];
	for (const entry of raw.services) {
		if (!isRecord(entry) || typeof entry.entityRef !== "string" ||
			!ENTITY_REF.test(entry.entityRef) || seen.has(entry.entityRef) ||
			typeof entry.state !== "string" || !STATES.has(entry.state)) return null;
		seen.add(entry.entityRef);
		services.push({ entityRef: entry.entityRef, state: "unknown" });
	}
	return {
		schemaVersion: 2, model: "backstage-health",
		catalogRevision: raw.catalogRevision as string, boardState: "stale", services,
	};
}

/** Drop published LKG after explicit access revocation or sign-out. */
export function clearPublicHomelabBrowserCache(storage: StoragePort): void {
	try { storage.removeItem(CATALOG_KEY); } catch { /* Storage may be disabled. */ }
	try { storage.removeItem(LEGACY_CATALOG_KEY); } catch { /* Storage may be disabled. */ }
	try { storage.removeItem(OLD_CATALOG_KEY); } catch { /* Storage may be disabled. */ }
	try { storage.removeItem(HEALTH_KEY); } catch { /* Storage may be disabled. */ }
}

/** Keep long-lived tabs current without extra catalog requests on rapid focus events. */
export function catalogRevalidationDue(lastAttemptAt: number, now = Date.now()): boolean {
	return Number.isFinite(lastAttemptAt) && Number.isFinite(now) &&
		now >= lastAttemptAt && now - lastAttemptAt >= CATALOG_REVALIDATION_MS;
}
