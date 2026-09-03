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
	directDependentIds: string[];
	transitiveDependentIds: string[];
	requiredDependencies: string[];
	optionalDependencies: string[];
};

export type ServiceImpactFocus = {
	id: string;
	requiredDependencyIds: string[];
	optionalDependencyIds: string[];
	directDependentIds: string[];
	indirectDependentIds: string[];
	transitiveDependentIds: string[];
	dependencyPathIds: string[];
};

const BLOCKING_RELATION_TYPES = new Set<ServiceRelationType>([
	"dependsOn",
	"consumesApi",
	"routesTo",
	"storesIn",
	"authenticatesVia",
	"partOf",
]);

const IMPACT_RELATION_TYPES = new Set<ServiceRelationType>([
	...BLOCKING_RELATION_TYPES,
	"hostedBy",
]);

const FOUNDATION_KINDS = new Set([
	"storage-platform",
	"container-runtime",
	"firewall",
	"edge",
	"network-gateway",
	"reverse-proxy",
]);

const SHARED_DATA_KINDS = new Set([
	"database",
	"cache",
	"key-value-store",
	"object-storage",
	"analytics-database",
	"vector-database",
	"message-broker",
	"search",
	"log-store",
	"metrics-store",
	"trace-store",
]);

const TIER_ORDER: Record<ServiceCriticalityTier, number> = {
	foundation: 0,
	"shared-data": 1,
	"shared-platform": 2,
	application: 3,
	support: 4,
};

export const SERVICE_CRITICALITY_TIERS = [
	"foundation",
	"shared-data",
	"shared-platform",
	"application",
	"support",
] as const satisfies readonly ServiceCriticalityTier[];

function isBlockingRequired(relation: ServiceTopologyRelation): boolean {
	return (
		relation.strength === "required" &&
		BLOCKING_RELATION_TYPES.has(relation.type)
	);
}

function isImpactRequired(relation: ServiceTopologyRelation): boolean {
	return (
		relation.strength === "required" &&
		IMPACT_RELATION_TYPES.has(relation.type)
	);
}

function semanticFoundation(node: ServiceTopologyNode): boolean {
	return FOUNDATION_KINDS.has(node.kind);
}

function semanticSharedData(node: ServiceTopologyNode): boolean {
	return node.category === "data" || SHARED_DATA_KINDS.has(node.kind);
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
	if (semanticSharedData(node) && transitiveDependents > 0) return "shared-data";
	if (transitiveDependents > 0) return "shared-platform";
	if (directDependencies > 0) return "application";
	return "support";
}

export function analyzeServiceCriticality(
	topology: ServiceTopology,
): Map<string, ServiceCriticality> {
	const requiredDependencies = new Map<string, Set<string>>();
	const impactDependents = new Map<string, Set<string>>();
	const optionalDependencies = new Map<string, Set<string>>();

	for (const relation of topology.relations) {
		if (isBlockingRequired(relation)) {
			const dependencies = requiredDependencies.get(relation.source) ?? new Set();
			dependencies.add(relation.target);
			requiredDependencies.set(relation.source, dependencies);
		} else if (
			relation.strength === "optional" &&
			BLOCKING_RELATION_TYPES.has(relation.type)
		) {
			const dependencies = optionalDependencies.get(relation.source) ?? new Set();
			dependencies.add(relation.target);
			optionalDependencies.set(relation.source, dependencies);
		}

		if (isImpactRequired(relation)) {
			const dependents = impactDependents.get(relation.target) ?? new Set();
			dependents.add(relation.source);
			impactDependents.set(relation.target, dependents);
		}
	}

	return new Map(
		topology.nodes.map((node) => {
			const directDependencyIds = [...(requiredDependencies.get(node.id) ?? [])].sort();
			const directDependentIds = [...(impactDependents.get(node.id) ?? [])].sort();
			const transitiveDependentIds = [
				...collectReachable(node.id, impactDependents),
			].sort();
			return [
				node.id,
				{
					id: node.id,
					tier: tierFor(
						node,
						directDependencyIds.length,
						transitiveDependentIds.length,
					),
					directDependents: directDependentIds.length,
					transitiveDependents: transitiveDependentIds.length,
					directDependencies: directDependencyIds.length,
					directDependentIds,
					transitiveDependentIds,
					requiredDependencies: directDependencyIds,
					optionalDependencies: [
						...(optionalDependencies.get(node.id) ?? []),
					].sort(),
				},
			];
		}),
	);
}

function longestRequiredDependencyPath(
	startId: string,
	analysis: Map<string, ServiceCriticality>,
	seen = new Set<string>(),
): string[] {
	if (seen.has(startId) || !analysis.has(startId)) return [];
	const nextSeen = new Set(seen).add(startId);
	const dependencies = (analysis.get(startId)?.requiredDependencies ?? []).filter(
		(id) => !nextSeen.has(id),
	);
	if (dependencies.length === 0) return [startId];

	const candidates = dependencies
		.map((dependencyId) =>
			longestRequiredDependencyPath(dependencyId, analysis, nextSeen),
		)
		.filter((path) => path.length > 0)
		.sort(
			(left, right) =>
				right.length - left.length || left.join("\0").localeCompare(right.join("\0")),
		);
	return [startId, ...(candidates[0] ?? [])];
}

export function buildServiceImpactFocus(
	id: string,
	topology: ServiceTopology,
	analysis = analyzeServiceCriticality(topology),
): ServiceImpactFocus | null {
	if (!topology.nodes.some((node) => node.id === id)) return null;
	const criticality = analysis.get(id);
	if (!criticality) return null;
	const direct = new Set(criticality.directDependentIds);

	return {
		id,
		requiredDependencyIds: criticality.requiredDependencies,
		optionalDependencyIds: criticality.optionalDependencies,
		directDependentIds: criticality.directDependentIds,
		indirectDependentIds: criticality.transitiveDependentIds.filter(
			(dependentId) => !direct.has(dependentId),
		),
		transitiveDependentIds: criticality.transitiveDependentIds,
		dependencyPathIds: longestRequiredDependencyPath(id, analysis),
	};
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
