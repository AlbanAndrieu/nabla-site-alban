import {
	type HomelabEnvironment,
	type HomelabService,
	homelabServiceId,
} from "./homelabServices";
import type { ServiceTopology } from "./serviceTopology";

export type HomelabEnvironmentSource = "topology" | "catalog" | "default";
export type HomelabEnvironmentFilter =
	| "all"
	| "non-dev"
	| "defaulted"
	| HomelabEnvironment;

export type ResolvedHomelabEnvironments = {
	names: ReadonlySet<HomelabEnvironment>;
	source: HomelabEnvironmentSource;
};

// Filtering resolves every card on each keystroke and poll; index nodes once
// per immutable topology instead of scanning them per service.
const nodeIndexCache = new WeakMap<
	ServiceTopology,
	Map<string, ServiceTopology["nodes"][number]>
>();

function topologyNode(topology: ServiceTopology, id: string) {
	let index = nodeIndexCache.get(topology);
	if (!index) {
		index = new Map();
		// Keep the first node per ID, as the previous linear `find` did.
		for (const node of topology.nodes) {
			if (!index.has(node.id)) index.set(node.id, node);
		}
		nodeIndexCache.set(topology, index);
	}
	return index.get(id);
}

/**
 * Resolve deployment environments from the authoritative topology first.
 *
 * Legacy catalog metadata remains a compatibility fallback. When neither source
 * declares an environment, the UI keeps the historical production default while
 * marking it as "default" so operators can review the missing metadata.
 */
export function resolveHomelabServiceEnvironments(
	service: HomelabService,
	topology: ServiceTopology | null,
): ResolvedHomelabEnvironments {
	const node = topology
		? topologyNode(topology, homelabServiceId(service))
		: undefined;
	const declared =
		node?.environments?.map((environment) => environment.name) ?? [];
	if (declared.length > 0) {
		return { names: new Set(declared), source: "topology" };
	}
	if (service.environment) {
		return { names: new Set([service.environment]), source: "catalog" };
	}
	return { names: new Set(["production"]), source: "default" };
}

export function homelabServiceMatchesEnvironment(
	environments: ResolvedHomelabEnvironments,
	filter: HomelabEnvironmentFilter,
): boolean {
	if (filter === "all") return true;
	if (filter === "defaulted") return environments.source === "default";
	if (filter === "non-dev") {
		return [...environments.names].some((environment) => environment !== "dev");
	}
	return environments.names.has(filter);
}
