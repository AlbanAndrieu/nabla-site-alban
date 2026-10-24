import { catalogHttpFailureStage, catalogTransportFailureStage, type CatalogFailureStage } from "./homelabCatalogFailureStage";
import {
	type CatalogV2Entity,
	catalogV2ServiceViews,
	type HomelabCatalogV2,
	parseHomelabCatalogV2,
} from "./homelabCatalogV2";

export const SITE_CATALOG_V2_URL =
	"https://fastapi-sample.fastapicloud.dev/api/site/catalog/v2";
const TIMEOUT_MS = 7000;
const SAFE_RELATIONS = [
	"dependsOn",
	"consumesApis",
	"providesApis",
	"children",
] as const;
const SAFE_REFERENCES = [
	"owner",
	"system",
	"domain",
	"subcomponentOf",
] as const;
const CRITICALITY = ["critical", "high", "medium", "low"] as const;
const ALLOWED_LABELS = [
	"albandrieu.com/operational-criticality",
	"albandrieu.com/business-criticality",
] as const;
const SAFE_TAG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SAFE_SOURCE = /^(?:apps\/[a-z0-9_-]+|catalog)\/catalog-info\.yaml$/;

export type SiteCatalogV2ErrorReason =
	| "key-missing"
	| "access-denied"
	| "unavailable";

export class SiteCatalogV2Error extends Error {
	constructor(public readonly reason: SiteCatalogV2ErrorReason, public readonly stage: CatalogFailureStage = "unknown") {
		super("Backstage v2 catalog unavailable");
		this.name = "SiteCatalogV2Error";
	}
}

/**
 * Retain only fields from the authenticated, sanitized SERVICE read-model.
 * Never return FastAPI's original response body to the browser.
 */
export function sanitizeSiteCatalogV2(
	catalog: HomelabCatalogV2,
): HomelabCatalogV2 | null {
	const refs = new Set(catalog.entities.map((item) => item.entityRef));
	const entities: CatalogV2Entity[] = [];
	for (const entity of catalog.entities) {
		if (!SAFE_SOURCE.test(entity.sourcePath)) return null;
		const metadata: CatalogV2Entity["metadata"] = {
			name: entity.metadata.name,
			...(entity.metadata.namespace
				? { namespace: entity.metadata.namespace }
				: {}),
			...(entity.metadata.title ? { title: entity.metadata.title } : {}),
		};
		if (entity.metadata.tags) {
			metadata.tags = entity.metadata.tags.filter((tag) => SAFE_TAG.test(tag));
		}
		const labels = Object.fromEntries(
			ALLOWED_LABELS.flatMap((name) => {
				const value = entity.metadata.labels?.[name];
				return value &&
					CRITICALITY.includes(value as (typeof CRITICALITY)[number])
					? [[name, value]]
					: [];
			}),
		);
		if (Object.keys(labels).length) metadata.labels = labels;
		const spec: Record<string, unknown> = {};
		for (const key of ["type", "lifecycle"] as const) {
			const value = entity.spec[key];
			if (typeof value === "string" && SAFE_TAG.test(value)) spec[key] = value;
		}
		for (const field of SAFE_REFERENCES) {
			const value = entity.spec[field];
			// Structural parents must resolve within the verified source. Other
			// optional organization refs may be omitted from this narrow DTO.
			if (
				field === "subcomponentOf" &&
				value !== undefined &&
				(typeof value !== "string" || !refs.has(value))
			)
				return null;
			if (typeof value === "string" && refs.has(value)) spec[field] = value;
		}
		for (const field of SAFE_RELATIONS) {
			const raw = entity.spec[field];
			if (!Array.isArray(raw)) continue;
			if (!raw.every((ref) => typeof ref === "string" && refs.has(ref)))
				return null;
			spec[field] = raw;
		}
		entities.push({
			apiVersion: entity.apiVersion,
			kind: entity.kind,
			entityRef: entity.entityRef,
			sourcePath: entity.sourcePath,
			metadata,
			spec,
		});
	}
	// catalogRevision identifies the *full* verified Backstage source, not our
	// narrower owner view. Never recompute it from sanitized fields.
	return parseHomelabCatalogV2({
		schemaVersion: 2,
		model: "backstage",
		catalogRevision: catalog.catalogRevision,
		entities,
	});
}

// The catalog changes on Backstage commits, not per request: share one verified
// copy across requests and de-duplicate concurrent loads. Failures are never
// cached. Keys include the fetch implementation (like fastApiHealthBoard) so a
// replaced fetch, e.g. in tests, never sees another caller's result.
const SITE_CATALOG_CACHE_MS = 60_000;

type SiteCatalogCacheKey = { key: string; fetchImpl: typeof fetch };

let cachedSiteCatalog:
	| (SiteCatalogCacheKey & { expiresAt: number; catalog: HomelabCatalogV2 })
	| null = null;
let inFlightSiteCatalog:
	| (SiteCatalogCacheKey & { promise: Promise<HomelabCatalogV2> })
	| null = null;

function sameCacheKey(a: SiteCatalogCacheKey, b: SiteCatalogCacheKey) {
	return a.key === b.key && a.fetchImpl === b.fetchImpl;
}

export async function fetchSiteCatalogV2(): Promise<HomelabCatalogV2> {
	const key = process.env.DIAGNOSTICS_ACCESS_KEY?.trim();
	if (!key) throw new SiteCatalogV2Error("key-missing", "site_configuration");
	const cacheKey = { key, fetchImpl: globalThis.fetch };
	if (
		cachedSiteCatalog &&
		sameCacheKey(cachedSiteCatalog, cacheKey) &&
		cachedSiteCatalog.expiresAt > Date.now()
	) {
		return cachedSiteCatalog.catalog;
	}
	if (inFlightSiteCatalog && sameCacheKey(inFlightSiteCatalog, cacheKey)) {
		return inFlightSiteCatalog.promise;
	}
	const promise = fetchSiteCatalogV2Uncached(key);
	inFlightSiteCatalog = { ...cacheKey, promise };
	try {
		const catalog = await promise;
		cachedSiteCatalog = {
			...cacheKey,
			expiresAt: Date.now() + SITE_CATALOG_CACHE_MS,
			catalog,
		};
		return catalog;
	} finally {
		if (inFlightSiteCatalog?.promise === promise) inFlightSiteCatalog = null;
	}
}

async function fetchSiteCatalogV2Uncached(
	key: string,
): Promise<HomelabCatalogV2> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const response = await fetch(SITE_CATALOG_V2_URL, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"X-Diagnostics-Key": key,
			},
			signal: controller.signal,
			redirect: "error",
			cache: "no-store",
		});
		if (response.status === 401 || response.status === 403) {
			throw new SiteCatalogV2Error("access-denied", "upstream_auth");
		}
		if (!response.ok) throw new SiteCatalogV2Error("unavailable",
			catalogHttpFailureStage(response.status, response.headers.get("X-Nabla-Diagnostic-Stage")));
		const parsed = parseHomelabCatalogV2(await response.json());
		const safe = parsed && sanitizeSiteCatalogV2(parsed);
		if (!safe || catalogV2ServiceViews(safe).length === 0) {
			throw new SiteCatalogV2Error("unavailable", "catalog_validation");
		}
		return safe;
	} catch (error) {
		if (error instanceof SiteCatalogV2Error) throw error;
		throw new SiteCatalogV2Error("unavailable", catalogTransportFailureStage(error));
	} finally {
		clearTimeout(timeout);
	}
}
