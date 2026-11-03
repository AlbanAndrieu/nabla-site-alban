import type {
	ServiceLifecycle,
	ServiceLifecyclePhase,
	ServiceTopologyNode,
} from "./serviceTopology";

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

export const LIFECYCLE_PHASE_ORDER: Record<ServiceLifecyclePhase, number> = {
	"bootstrap-runtime": 0,
	foundation: 1,
	"network-edge": 2,
	"primary-data": 3,
	"secondary-data": 4,
	"platform-services": 5,
	applications: 6,
};

function semanticFoundation(node: ServiceTopologyNode): boolean {
	return FOUNDATION_KINDS.has(node.kind);
}

function semanticSharedData(node: ServiceTopologyNode): boolean {
	return node.category === "data" || SHARED_DATA_KINDS.has(node.kind);
}

// Fallback for catalog entries without a declared lifecycle.
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
