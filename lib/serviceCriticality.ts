import type {
	ServiceLifecycle,
	ServiceLifecyclePhase,
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
	lifecyclePhase: ServiceLifecyclePhase;
	lifecyclePriority: number;
	lifecycleSource: "catalog" | "compatibility";
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
	"reverse-proxy",
]);

const NETWORK_EDGE_KINDS = new Set([
	"firewall",
	"edge",
	"network-gateway",
	"dns",
	"dns-server",
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
	"time-series-database",
]);

const FOUNDATION_IDS = new Set([
	"pihole",
	"adguard-home",
	"traefik",
	"vaultwarden",
]);
const PRIMARY_DATA_IDS = new Set([
	"postgresql",
	"mongo",
	"mongodb",
	"influxdb",
	"redis",
	"kafka",
]);
const SECONDARY_DATA_IDS = new Set([
	"clickhouse",
	"sentry-clickhouse",
	"opensearch",
	"elasticsearch",
	"elastic-search",
	"minio",
	"garage",
]);
const PLATFORM_CATEGORIES = new Set([
	"observability",
	"security",
	"automation",
]);
const PLATFORM_KINDS = new Set([
	"observability",
	"workflow",
	"model-runtime",
	"gateway",
	"siem",
	"ids",
	"monitoring",
]);

const TIER_ORDER: Record<ServiceCriticalityTier, number> = {
	foundation: 0,
	"shared-data": 1,
	"shared-platform": 2,
	application: 3,
	support: 4,
};

const LIFECYCLE_PHASE_ORDER: Record<ServiceLifecyclePhase, number> = {
	"bootstrap-runtime": 0,
	foundation: 1,
	"network-edge": 2,
	"primary-data": 3,
	"secondary-data": 4,
	"platform-services": 5,
	applications: 6,
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
		relation.strength === "required" && IMPACT_RELATION_TYPES.has(relation.type)
	);
}

function semanticFoundation(node: ServiceTopologyNode): boolean {
	return FOUNDATION_KINDS.has(node.kind);
}

function semanticSharedData(node: ServiceTopologyNode): boolean {
	return node.category === "data" || SHARED_DATA_KINDS.has(node.kind);
}

function compatibilityLifecycle(node: ServiceTopologyNode): ServiceLifecycle {
	const id = node.id.toLowerCase();
	if (id === "docker-socket-proxy") {
		return { phase: "bootstrap-runtime", priority: 0 };
	}
	if (FOUNDATION_IDS.has(id) || semanticFoundation(node)) {
		return { phase: "foundation", priority: 10 };
	}
	if (NETWORK_EDGE_KINDS.has(node.kind)) {
		return { phase: "network-edge", priority: 15 };
	}
	if (PRIMARY_DATA_IDS.has(id)) {
		return { phase: "primary-data", priority: 20 };
	}
	if (SECONDARY_DATA_IDS.has(id) || semanticSharedData(node)) {
		return { phase: "secondary-data", priority: 30 };
	}
	if (PLATFORM_CATEGORIES.has(node.category) || PLATFORM_KINDS.has(node.kind)) {
		return { phase: "platform-services", priority: 40 };
	}
	return { phase: "applications", priority: 50 };
}

export function resolveServiceLifecycle(node: ServiceTopologyNode): {
	lifecycle: ServiceLifecycle;
	source: "catalog" | "compatibility";
} {
	return node.lifecycle
		? { lifecycle: node.lifecycle, source: "catalog" }
		: { lifecycle: compatibilityLifecycle(node), source: "compatibility" };
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
	lifecycle: ServiceLifecycle,
	directDependencies: number,
	transitiveDependents: number,
): ServiceCriticalityTier {
	switch (lifecycle.phase) {
		case "bootstrap-runtime":
		case "foundation":
		case "network-edge":
			return "foundation";
		case "primary-data":
		case "secondary-data":
			return "shared-data";
		case "platform-services":
			return "shared-platform";
		case "applications":
			if (node.presentationRole === "support") return "support";
			if (directDependencies > 0 || transitiveDependents > 0)
				return "application";
			return "support";
	}
}

export function analyzeServiceCriticality(
	topology: ServiceTopology,
): Map<string, ServiceCriticality> {
	const requiredDependencies = new Map<string, Set<string>>();
	const impactDependents = new Map<string, Set<string>>();
	const optionalDependencies = new Map<string, Set<string>>();

	for (const relation of topology.relations) {
		if (isBlockingRequired(relation)) {
			const dependencies =
				requiredDependencies.get(relation.source) ?? new Set();
			dependencies.add(relation.target);
			requiredDependencies.set(relation.source, dependencies);
		} else if (
			relation.strength === "optional" &&
			BLOCKING_RELATION_TYPES.has(relation.type)
		) {
			const dependencies =
				optionalDependencies.get(relation.source) ?? new Set();
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
			const directDependencyIds = [
				...(requiredDependencies.get(node.id) ?? []),
			].sort();
			const directDependentIds = [
				...(impactDependents.get(node.id) ?? []),
			].sort();
			const transitiveDependentIds = [
				...collectReachable(node.id, impactDependents),
			].sort();
			const { lifecycle, source } = resolveServiceLifecycle(node);
			return [
				node.id,
				{
					id: node.id,
					tier: tierFor(
						node,
						lifecycle,
						directDependencyIds.length,
						transitiveDependentIds.length,
					),
					lifecyclePhase: lifecycle.phase,
					lifecyclePriority: lifecycle.priority,
					lifecycleSource: source,
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
	const dependencies = (
		analysis.get(startId)?.requiredDependencies ?? []
	).filter((id) => !nextSeen.has(id));
	if (dependencies.length === 0) return [startId];

	const candidates = dependencies
		.map((dependencyId) =>
			longestRequiredDependencyPath(dependencyId, analysis, nextSeen),
		)
		.filter((path) => path.length > 0)
		.sort(
			(left, right) =>
				right.length - left.length ||
				left.join("\0").localeCompare(right.join("\0")),
		);
	return [startId, ...(candidates[0] ?? [])];
}

function requiresTransitively(
	sourceId: string,
	targetId: string,
	analysis: Map<string, ServiceCriticality>,
): boolean {
	const seen = new Set<string>();
	const pending = [...(analysis.get(sourceId)?.requiredDependencies ?? [])];
	while (pending.length > 0) {
		const current = pending.pop();
		if (!current || seen.has(current)) continue;
		if (current === targetId) return true;
		seen.add(current);
		pending.push(...(analysis.get(current)?.requiredDependencies ?? []));
	}
	return false;
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

	const leftRequiresRight = requiresTransitively(leftId, rightId, analysis);
	const rightRequiresLeft = requiresTransitively(rightId, leftId, analysis);
	if (leftRequiresRight !== rightRequiresLeft)
		return leftRequiresRight ? 1 : -1;

	return (
		left.lifecyclePriority - right.lifecyclePriority ||
		LIFECYCLE_PHASE_ORDER[left.lifecyclePhase] -
			LIFECYCLE_PHASE_ORDER[right.lifecyclePhase] ||
		TIER_ORDER[left.tier] - TIER_ORDER[right.tier] ||
		right.transitiveDependents - left.transitiveDependents ||
		right.directDependents - left.directDependents ||
		leftId.localeCompare(rightId)
	);
}

export function criticalityTierOrder(tier: ServiceCriticalityTier): number {
	return TIER_ORDER[tier];
}
