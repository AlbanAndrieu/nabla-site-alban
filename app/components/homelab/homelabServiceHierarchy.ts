import {
	type HomelabEnvironmentFilter,
	homelabServiceMatchesEnvironment,
	resolveHomelabServiceEnvironments,
} from "@/lib/homelabEnvironments";
import type { HomelabHealthState } from "@/lib/homelabHealth";
import {
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import {
	groupCatalogByPresentation,
	type ServicePresentationGroup,
	type ServicePresentationGroupEntry,
} from "@/lib/servicePresentation";
import type { ServiceTopology } from "@/lib/serviceTopology";
import { effectiveState, type HomelabHealthIndex } from "./useHomelabHealth";
export { GROUP_TITLE_KEY, GROUP_DESCRIPTION_KEY, METRICS_PROFILE_KEY } from "@/lib/servicePresentationLabels";

export const ALL_GROUPS: readonly ServicePresentationGroup[] = [
	"services",
	"core-critical",
	"security-controls",
	"shared-core",
	"support",
];

export type HierarchyGroup = ServicePresentationGroupEntry;

export type HierarchyFilters = {
	healthFilter: "all" | HomelabHealthState;
	environmentFilter: HomelabEnvironmentFilter;
	searchQuery: string;
};

/** Filters the catalog by health, environment and search, then groups it for presentation. */
export function filterHierarchyGroups(
	catalog: HomelabServicesCatalog | null,
	topology: ServiceTopology | null,
	indexedHealth: HomelabHealthIndex,
	healthUnavailable: boolean,
	{ healthFilter, environmentFilter, searchQuery }: HierarchyFilters,
): HierarchyGroup[] {
	if (!catalog) return [];
	const query = searchQuery.trim().toLowerCase();
	const filteredServices = catalog.services.filter((service) => {
		const matchesHealth =
			healthFilter === "all" ||
			effectiveState(service, indexedHealth, healthUnavailable) ===
				healthFilter;
		const matchesEnvironment =
			environmentFilter === "all" ||
			homelabServiceMatchesEnvironment(
				resolveHomelabServiceEnvironments(service, topology),
				environmentFilter,
			);
		const matchesSearch =
			query.length === 0 ||
			service.name.toLowerCase().includes(query) ||
			homelabServiceId(service).includes(query) ||
			(service.kind?.toLowerCase().includes(query) ?? false) ||
			(service.category?.toLowerCase().includes(query) ?? false) ||
			(service.lifecycle?.toLowerCase().includes(query) ?? false) ||
			(service.catalogEntityKind?.toLowerCase().includes(query) ?? false);
		return matchesHealth && matchesEnvironment && matchesSearch;
	});
	const filteredCatalog = { ...catalog, services: filteredServices };
	if (!topology) {
		return filteredServices.length === 0
			? []
			: [
					{
						group: "services",
						catalog: filteredCatalog,
						metricsProfile: "red",
					},
				];
	}
	return groupCatalogByPresentation(filteredCatalog, topology);
}
