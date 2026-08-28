import type {
	ServiceRelationType,
	ServiceTopology,
	ServiceTopologyNode,
	ServiceTopologyRelation,
} from "./serviceTopology";

export type ServiceCriticalityTier =
	| "foundation"
	| "shared-data"
	| "shared-platform"
	| "application"
	| "support";

export type ServiceCriticality = {
	id: string;
	tier: ServiceCriticalityTier;
	directDependents: number;
	transitiveDependents: number;
	directDependencies: number;
	requiredDependencies: string[];
	optionalDependencies: string[];
};

const BLOCKING_RELATION_TYPES = new Set<ServiceRelationType>([
	"dependsOn",
	"consumesApi",
	"routesTo",
	"storesIn",
	"authenticatesVia",
	"partOf",
]);

const FOUNDATION_KINDS = new Set([
	"storage-platform",
	"container-runtime",
	"firewall",
	"edge",
	"network-gateway",
	"reverse-proxy",
]);

const TIER_ORDER: Record<ServiceCriticalityTier, number> = {
	foundation: 0,
	"shared-data": 1,
	"shared-platform": 2,
	application: 3,
	support: 4,
};

function isBlockingRequired(relation: ServiceTopologyRelation): boolean {
	return (
		relation.strength === "required" &&
		BLOCKING_RELATION_TYPES.has(relation.type)
	);
}

function semanticFoundation(node: ServiceTopologyNode): boolean {
	return FOUNDATION_KINDS.has(node.kind);
}

function collectReachable(
	start: string,
	adjacency: Map<string, Set<string>>,
): Set<string> {
	const seen = new Set<string>();
	const pending = [...(adjacency.get(start) ?? [])];
	while (pending.length > 0) {
		const current = pending.pop();
		if (!current || current === start || seen.has(current)) continue;
		seen.add(current);
		for (const next of adjacency.get(current) ?? []) {
			if (!seen.has(next)) pending.push(next);
		}
	}
	return seen;
}

function tierFor(
	node: ServiceTopologyNode,
	directDependencies: number,
	transitiveDependents: number,
): ServiceCriticalityTier {
	if (semanticFoundation(node)) return "foundation";
	if (node.category === "data" && transitiveDependents > 0) return "shared-data";
	if (transitiveDependents > 0) return "shared-platform";
	if (directDependencies > 0) return "application";
	return "support";
}

export function analyzeServiceCriticality(
	topology: ServiceTopology,
): Map<string, ServiceCriticality> {
	const requiredDependencies = new Map<string, Set<string>>();
	const requiredDependents = new Map<string, Set<string>>();
	const optionalDependencies = new Map<string, Set<string>>();

	for (const relation of topology.relations) {
		if (isBlockingRequired(relation)) {
			const dependencies = requiredDependencies.get(relation.source) ?? new Set();
			dependencies.add(relation.target);
			requiredDependencies.set(relation.source, dependencies);

			const dependents = requiredDependents.get(relation.target) ?? new Set();
			dependents.add(relation.source);
			requiredDependents.set(relation.target, dependents);
		} else if (
			relation.strength === "optional" &&
			BLOCKING_RELATION_TYPES.has(relation.type)
		) {
			const dependencies = optionalDependencies.get(relation.source) ?? new Set();
			dependencies.add(relation.target);
			optionalDependencies.set(relation.source, dependencies);
		}
	}

	return new Map(
		topology.nodes.map((node) => {
			const directDependencyIds = [...(requiredDependencies.get(node.id) ?? [])];
			const directDependentIds = [...(requiredDependents.get(node.id) ?? [])];
			const transitiveDependents = collectReachable(node.id, requiredDependents);
			return [
				node.id,
				{
					id: node.id,
					tier: tierFor(
						node,
						directDependencyIds.length,
						transitiveDependents.size,
					),
					directDependents: directDependentIds.length,
					transitiveDependents: transitiveDependents.size,
					directDependencies: directDependencyIds.length,
					requiredDependencies: directDependencyIds.sort(),
					optionalDependencies: [
						...(optionalDependencies.get(node.id) ?? []),
					].sort(),
				},
			];
		}),
	);
}

export function compareServiceCriticality(
	leftId: string,
	rightId: string,
	topology: ServiceTopology,
	analysis = analyzeServiceCriticality(topology),
): number {
	const left = analysis.get(leftId);
	const right = analysis.get(rightId);
	if (!left && !right) return leftId.localeCompare(rightId);
	if (!left) return 1;
	if (!right) return -1;
	return (
		TIER_ORDER[left.tier] - TIER_ORDER[right.tier] ||
		right.transitiveDependents - left.transitiveDependents ||
		right.directDependents - left.directDependents ||
		leftId.localeCompare(rightId)
	);
}

export function criticalityTierOrder(tier: ServiceCriticalityTier): number {
	return TIER_ORDER[tier];
}
