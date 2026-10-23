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
	type ServiceMetricsProfile,
	type ServicePresentationGroup,
	type ServicePresentationGroupEntry,
} from "@/lib/servicePresentation";
import type { ServiceTopology } from "@/lib/serviceTopology";
import { effectiveState, type HomelabHealthIndex } from "./useHomelabHealth";

export const ALL_GROUPS: readonly ServicePresentationGroup[] = [
	"services",
	"core-critical",
	"security-controls",
	"shared-core",
	"support",
];

export type HierarchyGroup = ServicePresentationGroupEntry;

type GroupTitleKey =
	| "presentation.groups.services"
	| "presentation.groups.core-critical"
	| "presentation.groups.security-controls"
	| "presentation.groups.shared-core"
	| "presentation.groups.support";

type GroupDescriptionKey =
	| "presentation.descriptions.services"
	| "presentation.descriptions.core-critical"
	| "presentation.descriptions.security-controls"
	| "presentation.descriptions.shared-core"
	| "presentation.descriptions.support";

type MetricsProfileKey =
	| "presentation.metrics.red"
	| "presentation.metrics.use"
	| "presentation.metrics.security"
	| "presentation.metrics.red-use"
	| "presentation.metrics.support";

export const GROUP_TITLE_KEY: Record<ServicePresentationGroup, GroupTitleKey> =
	{
		services: "presentation.groups.services",
		"core-critical": "presentation.groups.core-critical",
		"security-controls": "presentation.groups.security-controls",
		"shared-core": "presentation.groups.shared-core",
		support: "presentation.groups.support",
	};

export const GROUP_DESCRIPTION_KEY: Record<
	ServicePresentationGroup,
	GroupDescriptionKey
> = {
	services: "presentation.descriptions.services",
	"core-critical": "presentation.descriptions.core-critical",
	"security-controls": "presentation.descriptions.security-controls",
	"shared-core": "presentation.descriptions.shared-core",
	support: "presentation.descriptions.support",
};

export const METRICS_PROFILE_KEY: Record<
	ServiceMetricsProfile,
	MetricsProfileKey
> = {
	red: "presentation.metrics.red",
	use: "presentation.metrics.use",
	security: "presentation.metrics.security",
	"red-use": "presentation.metrics.red-use",
	support: "presentation.metrics.support",
};

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
			homelabServiceId(service).includes(query);
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
