import type {
	HomelabService,
	HomelabServicesCatalog,
} from "./homelabServices";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
} from "./serviceCriticality";
import type {
	ServiceTopology,
	ServiceTopologyNode,
} from "./serviceTopology";

export type ServicePresentationRole = "service" | "core" | "support";
export type ServiceOperationalCriticality =
	| "critical"
	| "high"
	| "medium"
	| "low";
export type ServicePresentationGroup =
	| "services"
	| "core-critical"
	| "security-controls"
	| "shared-core"
	| "support";
export type ServiceMetricsProfile = "red" | "use" | "security" | "red-use" | "support";

export type ServicePresentation = {
	id: string;
	role: ServicePresentationRole;
	criticality: ServiceOperationalCriticality;
	group: ServicePresentationGroup;
	metricsProfile: ServiceMetricsProfile;
	transitiveDependents: number;
};

export type ServicePresentationGroupEntry = {
	group: ServicePresentationGroup;
	catalog: HomelabServicesCatalog;
	metricsProfile: ServiceMetricsProfile;
};

const PRESENTATION_GROUP_ORDER: readonly ServicePresentationGroup[] = [
	"services",
	"core-critical",
	"security-controls",
	"shared-core",
	"support",
];

const CRITICALITY_WEIGHT: Record<ServiceOperationalCriticality, number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
};

const FOUNDATION_KINDS = new Set([
	"storage-platform",
	"container-runtime",
	"firewall",
	"edge",
	"network-gateway",
	"reverse-proxy",
	"orchestrator",
	"kubernetes-os",
	"cni",
	"csi",
	"dns",
	"ingress",
	"network-proxy",
]);

const FOUNDATION_IDS = new Set([
	"truenas",
	"docker",
	"pfsense",
	"pfsense-haproxy",
	"talos",
	"kubernetes",
	"etcd",
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

const SERVICE_KINDS = new Set([
	"application",
	"api",
	"service",
	"website",
	"web",
	"frontend",
	"workflow",
	"security-app",
]);

const SECURITY_CONTROL_KINDS = new Set([
	"firewall",
	"ids",
	"ips",
	"waf",
	"security-agent",
	"security-control",
	"siem",
	"vulnerability-scanner",
]);

const OBSERVABILITY_KINDS = new Set([
	"observability",
	"observability-ui",
	"metrics-exporter",
	"telemetry-collector",
	"log-store",
	"metrics-store",
	"trace-store",
]);

const VALID_ROLES = new Set<ServicePresentationRole>(["service", "core", "support"]);
const VALID_CRITICALITIES = new Set<ServiceOperationalCriticality>([
	"critical",
	"high",
	"medium",
	"low",
]);

function explicitRole(
	service: HomelabService,
	node: ServiceTopologyNode | undefined,
): ServicePresentationRole | null {
	const candidate = service.presentationRole ?? node?.presentationRole;
	return candidate && VALID_ROLES.has(candidate) ? candidate : null;
}

function explicitCriticality(
	service: HomelabService,
	node: ServiceTopologyNode | undefined,
): ServiceOperationalCriticality | null {
	const candidate = service.criticality ?? node?.criticality;
	return candidate && VALID_CRITICALITIES.has(candidate) ? candidate : null;
}

function inferredRole(
	node: ServiceTopologyNode,
	directDependencies: number,
	transitiveDependents: number,
): ServicePresentationRole {
	if (FOUNDATION_IDS.has(node.id) || FOUNDATION_KINDS.has(node.kind)) return "core";
	if (SECURITY_CONTROL_KINDS.has(node.kind)) return "core";
	if (SERVICE_KINDS.has(node.kind)) return "service";
	if (
		directDependencies > 0 &&
		transitiveDependents === 0 &&
		!["infrastructure", "network", "data", "observability"].includes(node.category)
	) {
		return "service";
	}
	if (transitiveDependents > 0) return "core";
	return "support";
}

function inferredCriticality(
	node: ServiceTopologyNode,
	role: ServicePresentationRole,
	transitiveDependents: number,
): ServiceOperationalCriticality {
	if (FOUNDATION_IDS.has(node.id) || FOUNDATION_KINDS.has(node.kind)) {
		return "critical";
	}
	if (role === "core" && SECURITY_CONTROL_KINDS.has(node.kind)) return "high";
	if (
		role === "core" &&
		(node.category === "data" || SHARED_DATA_KINDS.has(node.kind)) &&
		transitiveDependents > 0
	) {
		return "high";
	}
	if (role === "core") return "high";
	if (role === "service") return "medium";
	return "low";
}

function presentationGroup(
	node: ServiceTopologyNode,
	role: ServicePresentationRole,
	criticality: ServiceOperationalCriticality,
	transitiveDependents: number,
): ServicePresentationGroup {
	if (role === "service") return "services";
	if (criticality === "critical") return "core-critical";
	if (SECURITY_CONTROL_KINDS.has(node.kind)) return "security-controls";
	if (
		role === "core" ||
		transitiveDependents > 0 ||
		SHARED_DATA_KINDS.has(node.kind)
	) {
		return "shared-core";
	}
	if (OBSERVABILITY_KINDS.has(node.kind) || role === "support") return "support";
	return "support";
}

export function metricsProfileForGroup(
	group: ServicePresentationGroup,
): ServiceMetricsProfile {
	switch (group) {
		case "services":
			return "red";
		case "core-critical":
			return "use";
		case "security-controls":
			return "security";
		case "shared-core":
			return "red-use";
		case "support":
			return "support";
	}
}

export function analyzeServicePresentation(
	catalog: HomelabServicesCatalog,
	topology: ServiceTopology,
): Map<string, ServicePresentation> {
	const technical = analyzeServiceCriticality(topology);
	const nodes = new Map(topology.nodes.map((node) => [node.id, node]));
	const analysis = new Map<string, ServicePresentation>();

	for (const service of catalog.services) {
		const id = service.id?.trim() || service.name.trim().toLowerCase();
		const node = nodes.get(id) ?? {
			id,
			name: service.name,
			kind: service.kind ?? "service",
			category: service.category ?? "application",
		};
		const impact = technical.get(id);
		const directDependencies = impact?.directDependencies ?? 0;
		const transitiveDependents = impact?.transitiveDependents ?? 0;
		const role =
			explicitRole(service, node) ??
			inferredRole(node, directDependencies, transitiveDependents);
		const criticality =
			explicitCriticality(service, node) ??
			inferredCriticality(node, role, transitiveDependents);
		const group = presentationGroup(node, role, criticality, transitiveDependents);
		analysis.set(id, {
			id,
			role,
			criticality,
			group,
			metricsProfile: metricsProfileForGroup(group),
			transitiveDependents,
		});
	}

	return analysis;
}

export function groupCatalogByPresentation(
	catalog: HomelabServicesCatalog,
	topology: ServiceTopology,
): ServicePresentationGroupEntry[] {
	const presentation = analyzeServicePresentation(catalog, topology);
	const technical = analyzeServiceCriticality(topology);
	const grouped = new Map<ServicePresentationGroup, typeof catalog.services>();

	for (const service of catalog.services) {
		const id = service.id?.trim() || service.name.trim().toLowerCase();
		const group = presentation.get(id)?.group ?? "support";
		grouped.set(group, [...(grouped.get(group) ?? []), service]);
	}

	return PRESENTATION_GROUP_ORDER.flatMap((group) => {
		const services = grouped.get(group);
		if (!services?.length) return [];
		const sorted = [...services].sort((left, right) => {
			const leftId = left.id?.trim() || left.name.trim().toLowerCase();
			const rightId = right.id?.trim() || right.name.trim().toLowerCase();
			const leftPresentation = presentation.get(leftId);
			const rightPresentation = presentation.get(rightId);
			return (
				CRITICALITY_WEIGHT[leftPresentation?.criticality ?? "low"] -
					CRITICALITY_WEIGHT[rightPresentation?.criticality ?? "low"] ||
				compareServiceCriticality(leftId, rightId, topology, technical)
			);
		});
		return [
			{
				group,
				catalog: { ...catalog, services: sorted },
				metricsProfile: metricsProfileForGroup(group),
			},
		];
	});
}

export function servicePresentationGroupOrder(group: ServicePresentationGroup): number {
	return PRESENTATION_GROUP_ORDER.indexOf(group);
}
