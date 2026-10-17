import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import { resolveEffectiveServiceState } from "@/lib/homelabHealthResolver";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import type { ServicePresentationGroup } from "@/lib/servicePresentation";

export type HealthFilter = "all" | HomelabHealthState;
export type GroupFilter = "all" | ServicePresentationGroup;
type PresentationGroupTitleKey =
	| "presentation.groups.services"
	| "presentation.groups.core-critical"
	| "presentation.groups.security-controls"
	| "presentation.groups.shared-core"
	| "presentation.groups.support";

export type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

export type HealthStateCounts = Record<HomelabHealthState, number>;

export const HEALTH_STATES: readonly HomelabHealthState[] = [
	"ok",
	"warn",
	"fail",
	"unknown",
];
export const GROUP_FILTERS: readonly GroupFilter[] = [
	"all",
	"services",
	"core-critical",
	"security-controls",
	"shared-core",
	"support",
];

export const PRESENTATION_GROUP_TITLE_KEY: Record<
	ServicePresentationGroup,
	PresentationGroupTitleKey
> = {
	services: "presentation.groups.services",
	"core-critical": "presentation.groups.core-critical",
	"security-controls": "presentation.groups.security-controls",
	"shared-core": "presentation.groups.shared-core",
	support: "presentation.groups.support",
};

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

export function indexHealth(
	snapshot: HomelabHealthSnapshot | null,
): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
	}
	return { byId, byName };
}

export function effectiveState(
	serviceId: string,
	serviceName: string,
	index: HealthIndex,
): HomelabHealthState {
	const entry =
		index.byId.get(serviceId) ?? index.byName.get(normalizedName(serviceName));
	return entry ? resolveEffectiveServiceState(entry).effectiveState : "unknown";
}

export function snapshotAgeSeconds(
	checkedAt: string | undefined,
	now: number,
): number | null {
	if (!checkedAt) return null;
	const checkedAtMs = Date.parse(checkedAt);
	if (!Number.isFinite(checkedAtMs)) return null;
	return Math.max(0, Math.floor((now - checkedAtMs) / 1000));
}

/** Count declared catalog services per effective health state. */
export function countHealthStates(
	services: readonly HomelabService[],
	healthIndex: HealthIndex,
): HealthStateCounts {
	const result: HealthStateCounts = {
		ok: 0,
		warn: 0,
		fail: 0,
		unknown: 0,
	};
	for (const service of services) {
		const state = effectiveState(
			homelabServiceId(service),
			service.name,
			healthIndex,
		);
		result[state] += 1;
	}
	return result;
}

export type ArchitectureCatalogFilters = {
	healthIndex: HealthIndex;
	presentation: ReadonlyMap<string, { group: ServicePresentationGroup }>;
	healthFilter: HealthFilter;
	groupFilter: GroupFilter;
	searchQuery: string;
};

/**
 * Keep declared services matching the health, presentation group and search
 * filters. Services without a presentation entry fall back to "support".
 */
export function filterArchitectureCatalog(
	catalog: HomelabServicesCatalog,
	{
		healthIndex,
		presentation,
		healthFilter,
		groupFilter,
		searchQuery,
	}: ArchitectureCatalogFilters,
): HomelabServicesCatalog {
	const query = searchQuery.trim().toLowerCase();
	const services = catalog.services.filter((service) => {
		const id = homelabServiceId(service);
		const state = effectiveState(id, service.name, healthIndex);
		const group = presentation.get(id)?.group ?? "support";
		const matchesSearch =
			query.length === 0 ||
			service.name.toLowerCase().includes(query) ||
			id.includes(query);
		return (
			(healthFilter === "all" || state === healthFilter) &&
			(groupFilter === "all" || group === groupFilter) &&
			matchesSearch
		);
	});
	return { ...catalog, services };
}
