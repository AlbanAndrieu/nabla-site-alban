import {
	type CatalogFailureStage,
	parseOwnerCatalogIncident,
} from "@/lib/homelabCatalogFailureStage";
import { parseHomelabCatalogV2 } from "@/lib/homelabCatalogV2";
import { projectHomelabCatalogV2 } from "@/lib/homelabCatalogV2Projection";
import { classifyCatalogFailure } from "@/lib/homelabClientAccessBoundary";
import {
	type HomelabHealthSnapshot,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import { parsePublicHomelabCatalogPayload } from "@/lib/homelabPublicBrowserCache";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import { boundedHomelabSignal } from "@/lib/homelabSlowApiPolicy";
import type { ServiceTopology } from "@/lib/serviceTopology";

// Bounded HTTP readers behind useHomelabHealth; state transitions stay in the hook.

export type HealthFetchResult = {
	snapshot: HomelabHealthSnapshot | null;
	status: number | null;
	reason?: "owner-boundary";
};

export class CatalogV2Unavailable extends Error {
	constructor(
		readonly reason: "key-missing" | "access-denied" | "unavailable",
		readonly revokePublicCache = false,
		readonly incident: {
			stage: CatalogFailureStage;
			requestId: string;
		} | null = null,
	) {
		super("Backstage v2 catalog unavailable");
	}
}

export async function fetchCatalog(
	signal: AbortSignal,
	readOnly: boolean,
): Promise<{
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology | null;
}> {
	const response = await fetch("/api/homelab-catalog-v2", {
		cache: "no-store",
		signal: boundedHomelabSignal(signal),
	});
	if (!response.ok) {
		const body: unknown = await response.json().catch(() => null);
		const policy = classifyCatalogFailure(response.status, body);
		const incident = readOnly
			? null
			: parseOwnerCatalogIncident(
					response.headers.get("X-Nabla-Diagnostic-Stage"),
					response.headers.get("X-Nabla-Request-ID"),
				);
		throw new CatalogV2Unavailable(
			policy.reason,
			policy.revokePublicCache,
			incident,
		);
	}
	const parsed = parseHomelabCatalogV2(await response.json());
	if (!parsed || parsed.entities.length === 0) {
		throw new CatalogV2Unavailable("unavailable");
	}
	const { services, topology } = projectHomelabCatalogV2(parsed);
	if (readOnly) {
		// Never render unvalidated JSON or retain OWNER-only catalog fields
		// merely because the same-origin gateway returned HTTP 200.
		const safe = parsePublicHomelabCatalogPayload({ ...services, topology });
		if (!safe) throw new CatalogV2Unavailable("unavailable");
		return safe;
	}
	return { catalog: services, topology };
}

type HealthEndpoint = "/api/homelab-health" | "/api/homelab-probes";

/** Shared HTTP envelope; probes keep their explicit no-cache request headers. */
async function fetchHealthEndpoint(
	endpoint: HealthEndpoint,
	signal: AbortSignal,
	probe: boolean,
): Promise<HealthFetchResult> {
	try {
		const response = await fetch(endpoint, {
			cache: "no-store",
			signal: boundedHomelabSignal(signal),
			...(probe
				? {
						headers: {
							Accept: "application/json",
							"Cache-Control": "no-cache",
						},
					}
				: {}),
		});
		if (!response.ok) {
			return {
				snapshot: null,
				status: response.status,
				...(response.headers.get("X-Homelab-Health-Reason") === "owner-boundary"
					? { reason: "owner-boundary" as const }
					: {}),
			};
		}
		return {
			snapshot: parseHomelabHealthSnapshot(await response.json()),
			status: response.status,
		};
	} catch {
		return { snapshot: null, status: null };
	}
}

export async function fetchHealth(
	signal: AbortSignal,
): Promise<HealthFetchResult> {
	return fetchHealthEndpoint("/api/homelab-health", signal, false);
}

export async function fetchProbeHealth(
	signal: AbortSignal,
): Promise<HealthFetchResult> {
	return fetchHealthEndpoint("/api/homelab-probes", signal, true);
}
