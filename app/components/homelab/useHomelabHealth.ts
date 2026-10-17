import { useEffect, useState } from "react";
import {
	type HomelabHealthEntry,
	type HomelabHealthSnapshot,
	type HomelabHealthState,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
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

export const HEALTH_REFRESH_MS = 30_000;

export type HealthFetchResult = {
	snapshot: HomelabHealthSnapshot | null;
	status: number | null;
};

export type HomelabServicesState = {
	catalog: HomelabServicesCatalog | null;
	topology: ServiceTopology | null;
	snapshot: HomelabHealthSnapshot | null;
	error: boolean;
	healthUnavailable: boolean;
	healthStatus: number | null;
	healthRefreshing: boolean;
};

export const INITIAL_HOMELAB_SERVICES_STATE: HomelabServicesState = {
	catalog: null,
	topology: null,
	snapshot: null,
	error: false,
	healthUnavailable: false,
	healthStatus: null,
	healthRefreshing: true,
};

async function fetchCatalog(
	signal: AbortSignal,
): Promise<HomelabServicesCatalog> {
	const response = await fetch("/api/homelab-services", {
		cache: "no-store",
		signal,
	});
	if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
	return (await response.json()) as HomelabServicesCatalog;
}

async function fetchTopology(
	signal: AbortSignal,
): Promise<ServiceTopology | null> {
	try {
		const response = await fetch("/api/homelab-topology", {
			cache: "no-store",
			signal,
			headers: { Accept: "application/json" },
		});
		if (!response.ok) return null;
		return parseServiceTopology(await response.json());
	} catch (error) {
		if (signal.aborted) throw error;
		return null;
	}
}

async function fetchHealth(signal: AbortSignal): Promise<HealthFetchResult> {
	try {
		const response = await fetch("/api/homelab-health", {
			cache: "no-store",
			signal,
		});
		if (!response.ok) return { snapshot: null, status: response.status };
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
		if (!response.ok) return { snapshot: null, status: response.status };
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
		error: false,
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
		healthRefreshing: false,
		error:
			current.catalog === null &&
			aggregate.snapshot === null &&
			probes.snapshot === null,
	};
}

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

export type HomelabHealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

export function healthIndex(
	snapshot: HomelabHealthSnapshot | null,
): HomelabHealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
	}
	return { byId, byName };
}

export function effectiveState(
	service: HomelabService,
	index: HomelabHealthIndex,
	healthUnavailable = false,
): HomelabHealthState {
	if (healthUnavailable) return "unknown";
	const entry =
		index.byId.get(homelabServiceId(service)) ??
		index.byName.get(normalizedName(service.name));
	return entry ? resolveEffectiveServiceState(entry).effectiveState : "unknown";
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
export function useHomelabHealth(): HomelabServicesState {
	const [state, setState] = useState<HomelabServicesState>(
		INITIAL_HOMELAB_SERVICES_STATE,
	);

	useEffect(() => {
		const initialController = new AbortController();
		let refreshController: AbortController | null = null;

		const runHealthCycle = async (signal: AbortSignal) => {
			setState((current) => ({ ...current, healthRefreshing: true }));
			const probesPromise = fetchProbeHealth(signal);
			const aggregatePromise = fetchHealth(signal);

			const probes = await probesPromise;
			if (signal.aborted) return;
			if (probes.snapshot) {
				setState((current) => applyProbeSnapshot(current, probes));
			}

			const aggregate = await aggregatePromise;
			if (signal.aborted) return;
			setState((current) => applyHealthCycle(current, aggregate, probes));
		};

		const refreshHealth = () => {
			if (document.hidden) return;
			refreshController?.abort();
			refreshController = new AbortController();
			void runHealthCycle(refreshController.signal);
		};

		void Promise.all([
			fetchCatalog(initialController.signal),
			fetchTopology(initialController.signal),
		])
			.then(([catalog, topology]) => {
				if (!initialController.signal.aborted) {
					setState((current) => ({
						...current,
						catalog,
						topology,
						error: false,
					}));
				}
			})
			.catch(() => {
				if (!initialController.signal.aborted) {
					setState((current) => ({ ...current, error: true }));
				}
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
	}, []);

	return state;
}
