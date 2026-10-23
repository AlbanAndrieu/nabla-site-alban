import { useEffect, useState } from "react";
import {
	type HomelabHealthEntry,
	type HomelabHealthSnapshot,
	type HomelabHealthState,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import { compatibleHomelabEvidence } from "@/lib/homelabHealthIdentity";
import { resolveEffectiveServiceState } from "@/lib/homelabHealthResolver";
import { mergeHomelabProbeDiagnostics } from "@/lib/homelabProbeMerge";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import {
	parseServiceTopology,
	type ServiceTopology,
} from "@/lib/serviceTopology";
import {
	parseSiteHealthV2,
	type SiteHealthV2,
	siteHealthIndex,
} from "@/lib/siteHealthV2";

export const HEALTH_REFRESH_MS = 30_000;
const MIN_REFRESH_GAP_MS = 5_000;

export type HealthFetchResult = {
	snapshot: HomelabHealthSnapshot | null;
	status: number | null;
	reason?: "owner-boundary";
};

export type HomelabServicesState = {
	catalog: HomelabServicesCatalog | null;
	catalogFailure: "key-missing" | "access-denied" | "unavailable" | null;
	topology: ServiceTopology | null;
	snapshot: HomelabHealthSnapshot | null;
	siteHealth: SiteHealthV2 | null;
	error: boolean;
	healthUnavailable: boolean;
	healthStatus: number | null;
	healthRefreshing: boolean;
	ownerBoundary?: boolean;
};

export const INITIAL_HOMELAB_SERVICES_STATE: HomelabServicesState = {
	catalog: null,
	catalogFailure: null,
	topology: null,
	snapshot: null,
	siteHealth: null,
	error: false,
	healthUnavailable: false,
	healthStatus: null,
	healthRefreshing: true,
	ownerBoundary: false,
};

class CatalogV2Unavailable extends Error {
	constructor(
		readonly reason: "key-missing" | "access-denied" | "unavailable",
	) {
		super("Backstage v2 catalog unavailable");
	}
}

async function fetchCatalog(signal: AbortSignal): Promise<{
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology | null;
}> {
	const response = await fetch("/api/homelab-services", {
		cache: "no-store",
		signal,
	});
	if (!response.ok) {
		// The same-origin owner route returns only a sanitized diagnostic reason.
		const body: unknown = await response.json().catch(() => null);
		const reason =
			typeof body === "object" && body !== null && "reason" in body
				? (body as { reason?: unknown }).reason
				: null;
		throw new CatalogV2Unavailable(
			reason === "key-missing" || reason === "access-denied"
				? reason
				: "unavailable",
		);
	}
	const payload: unknown = await response.json();
	if (
		typeof payload !== "object" ||
		payload === null ||
		!("version" in payload) ||
		payload.version !== 2 ||
		!("services" in payload) ||
		!Array.isArray(payload.services)
	) {
		throw new CatalogV2Unavailable("unavailable");
	}
	const catalog = payload as HomelabServicesCatalog;
	const topology =
		"topology" in payload ? parseServiceTopology(payload.topology) : null;
	return {
		catalog,
		topology:
			topology?.catalogRevision === catalog.catalogRevision ? topology : null,
	};
}

async function fetchHealth(signal: AbortSignal): Promise<HealthFetchResult> {
	try {
		const response = await fetch("/api/homelab-health", {
			cache: "no-store",
			signal,
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

async function fetchProbeHealth(
	signal: AbortSignal,
): Promise<HealthFetchResult> {
	try {
		const response = await fetch("/api/homelab-probes", {
			cache: "no-store",
			signal,
			headers: {
				Accept: "application/json",
				"Cache-Control": "no-cache",
			},
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

/** Bounded probes render first, while the aggregate snapshot is still loading. */
export function applyProbeSnapshot(
	current: HomelabServicesState,
	probes: HealthFetchResult,
): HomelabServicesState {
	if (!probes.snapshot) return current;
	return {
		...current,
		snapshot: probes.snapshot,
		healthUnavailable: false,
		healthStatus: probes.status,
		healthRefreshing: true,
		error: current.error,
	};
}

/** Aggregate enrichment wins; probes, then the last snapshot, are fallbacks. */
export function applyHealthCycle(
	current: HomelabServicesState,
	aggregate: HealthFetchResult,
	probes: HealthFetchResult,
): HomelabServicesState {
	return {
		...current,
		snapshot: aggregate.snapshot
			? mergeHomelabProbeDiagnostics(aggregate.snapshot, probes.snapshot)
			: (probes.snapshot ?? current.snapshot),
		healthUnavailable: aggregate.snapshot === null && probes.snapshot === null,
		healthStatus: aggregate.status ?? probes.status,
		ownerBoundary:
			aggregate.reason === "owner-boundary" &&
			probes.reason === "owner-boundary",
		healthRefreshing: false,
		error:
			current.error ||
			(current.catalog === null &&
				aggregate.snapshot === null &&
				probes.snapshot === null),
	};
}

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

export type HomelabHealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
	byRef: Map<string, HomelabHealthState>;
};

export function healthIndex(
	snapshot: HomelabHealthSnapshot | null,
	siteHealth?: SiteHealthV2 | null,
	catalogRevision?: unknown,
): HomelabHealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
	}
	return { byId, byName, byRef: siteHealthIndex(siteHealth, catalogRevision) };
}

export function effectiveState(
	service: HomelabService,
	index: HomelabHealthIndex,
	healthUnavailable = false,
): HomelabHealthState {
	const serviceId = homelabServiceId(service);
	const entry = compatibleHomelabEvidence(
		service.entityRef,
		serviceId,
		index.byId.get(serviceId) ?? index.byName.get(normalizedName(service.name)),
	);
	if (entry && !healthUnavailable) {
		return resolveEffectiveServiceState(entry).effectiveState;
	}
	if (typeof service.entityRef === "string") {
		const state = index.byRef.get(service.entityRef);
		if (state) return state;
	}
	return "unknown";
}

export function countHealthStates(
	services: readonly HomelabService[],
	index: HomelabHealthIndex,
	healthUnavailable: boolean,
): Record<HomelabHealthState, number> {
	const counts: Record<HomelabHealthState, number> = {
		ok: 0,
		warn: 0,
		fail: 0,
		unknown: 0,
	};
	for (const service of services)
		counts[effectiveState(service, index, healthUnavailable)] += 1;
	return counts;
}

/**
 * Loads the catalog and topology once, then polls probe and aggregate health
 * every HEALTH_REFRESH_MS while the page is visible.
 */
export function useHomelabHealth(readOnly = false): HomelabServicesState {
	const [state, setState] = useState<HomelabServicesState>(
		INITIAL_HOMELAB_SERVICES_STATE,
	);

	useEffect(() => {
		const initialController = new AbortController();
		let refreshController: AbortController | null = null;
		let ownerUpstreamBlocked = false;
		let lastCycleStartedAt = 0;

		const runHealthCycle = async (signal: AbortSignal) => {
			lastCycleStartedAt = Date.now();
			setState((current) => ({ ...current, healthRefreshing: true }));
			if (readOnly) {
				// External views consume only the strict SERVICE v2 projection.
				// Do not even request private OWNER aggregate/probe endpoints.
				let siteHealth: SiteHealthV2 | null = null;
				let status: number | null = null;
				try {
					const response = await fetch("/api/homelab-health-v2", {
						cache: "no-store",
						signal,
						headers: { Accept: "application/json" },
					});
					status = response.status;
					if (response.ok)
						siteHealth = parseSiteHealthV2(await response.json());
				} catch {
					// Missing v2 evidence is UNKNOWN, not an observed outage.
				}
				if (!signal.aborted) {
					setState((current) => ({
						...current,
						siteHealth,
						snapshot: null,
						healthUnavailable: siteHealth?.boardState !== "fresh",
						healthStatus: status,
						healthRefreshing: false,
					}));
				}
				return;
			}

			// SERVICE status DTO is independent from OWNER-only probe details.
			void fetch("/api/homelab-health-v2", {
				cache: "no-store",
				signal,
				headers: { Accept: "application/json" },
			})
				.then(async (response) =>
					response.ok ? parseSiteHealthV2(await response.json()) : null,
				)
				.then((siteHealth) => {
					if (!signal.aborted)
						setState((current) => ({ ...current, siteHealth }));
				})
				.catch(() => {
					if (!signal.aborted)
						setState((current) => ({ ...current, siteHealth: null }));
				});
			// Keep SERVICE v2 polling even after Vercel's OWNER boundary is confirmed.
			if (ownerUpstreamBlocked) {
				setState((current) => ({ ...current, healthRefreshing: false }));
				return;
			}
			const probesPromise = fetchProbeHealth(signal);
			const aggregatePromise = fetchHealth(signal);

			const probes = await probesPromise;
			if (signal.aborted) return;
			if (probes.snapshot) {
				setState((current) => applyProbeSnapshot(current, probes));
			}

			const aggregate = await aggregatePromise;
			if (signal.aborted) return;
			ownerUpstreamBlocked =
				aggregate.reason === "owner-boundary" &&
				probes.reason === "owner-boundary";
			setState((current) => applyHealthCycle(current, aggregate, probes));
		};

		const refreshHealth = () => {
			if (document.hidden) return;
			// A tab focus right after a tick (or the initial cycle) must not
			// fire a second identical burst of health requests.
			if (Date.now() - lastCycleStartedAt < MIN_REFRESH_GAP_MS) return;
			refreshController?.abort();
			refreshController = new AbortController();
			void runHealthCycle(refreshController.signal);
		};

		// Catalog drives the service cards; topology is optional enrichment.
		// Never make an unavailable topology hide an otherwise valid inventory.
		void fetchCatalog(initialController.signal)
			.then(({ catalog, topology }) => {
				if (initialController.signal.aborted) return;
				setState((current) => ({
					...current,
					catalog,
					topology,
					catalogFailure: null,
					error: false,
				}));
			})
			.catch((error: unknown) => {
				if (initialController.signal.aborted) return;
				setState((current) => ({
					...current,
					error: true,
					catalogFailure:
						error instanceof CatalogV2Unavailable
							? error.reason
							: "unavailable",
				}));
			});

		void runHealthCycle(initialController.signal);

		const interval = window.setInterval(refreshHealth, HEALTH_REFRESH_MS);
		const onVisibilityChange = () => {
			if (!document.hidden) refreshHealth();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			initialController.abort();
			refreshController?.abort();
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, [readOnly]);

	// An access-mode switch may race with an in-flight OWNER fetch.
	// Public components must never receive a previously cached OWNER snapshot.
	if (readOnly) {
		return {
			...state,
			snapshot: null,
			ownerBoundary: false,
			healthStatus: null,
			healthUnavailable: state.siteHealth?.boardState !== "fresh",
		};
	}
	return state;
}
