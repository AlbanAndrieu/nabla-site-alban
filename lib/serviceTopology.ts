import localTopology from "../public/service-topology.json";

export type ServiceTopologyNode = {
	id: string;
	name: string;
	kind: string;
	category: string;
	sourcePath?: string;
	url?: string;
	description?: string;
	icon?: string;
};

export type ServiceRelationType =
	| "dependsOn"
	| "consumesApi"
	| "providesApi"
	| "partOf"
	| "routesTo"
	| "observedBy"
	| "storesIn"
	| "authenticatesVia"
	| "exposedBy"
	| "automates";

export type ServiceTopologyRelation = {
	source: string;
	target: string;
	type: ServiceRelationType;
	strength: "required" | "optional";
	description?: string;
	evidence: string[];
};

export type ServiceTopology = {
	version: number;
	name: string;
	nodes: ServiceTopologyNode[];
	relations: ServiceTopologyRelation[];
};

export type ServiceTopologySource = "fastapi" | "local-fallback";

export const SERVICE_TOPOLOGY_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab-topology";

const PRIMARY_TIMEOUT_MS = 2500;
const RELATION_TYPES = new Set<ServiceRelationType>([
	"dependsOn",
	"consumesApi",
	"providesApi",
	"partOf",
	"routesTo",
	"observedBy",
	"storesIn",
	"authenticatesVia",
	"exposedBy",
	"automates",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseServiceTopology(value: unknown): ServiceTopology | null {
	if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.relations)) {
		return null;
	}
	if (typeof value.version !== "number" || typeof value.name !== "string") return null;

	const nodes = value.nodes;
	if (
		!nodes.every(
			(node) =>
				isRecord(node) &&
				typeof node.id === "string" &&
				typeof node.name === "string" &&
				typeof node.kind === "string" &&
				typeof node.category === "string" &&
				(node.icon === undefined || typeof node.icon === "string"),
		)
	) {
		return null;
	}
	const nodeIds = new Set(nodes.map((node) => String(node.id)));
	if (nodeIds.size !== nodes.length) return null;

	if (
		!value.relations.every(
			(relation) =>
				isRecord(relation) &&
				typeof relation.source === "string" &&
				typeof relation.target === "string" &&
				typeof relation.type === "string" &&
				RELATION_TYPES.has(relation.type as ServiceRelationType) &&
				(relation.strength === "required" || relation.strength === "optional") &&
				Array.isArray(relation.evidence) &&
				relation.evidence.every((entry) => typeof entry === "string") &&
				nodeIds.has(relation.source) &&
				nodeIds.has(relation.target),
		)
	) {
		return null;
	}

	return value as ServiceTopology;
}

const parsedLocalFallback = parseServiceTopology(localTopology);
if (!parsedLocalFallback) {
	throw new Error("Invalid local service-topology.json fallback");
}
const LOCAL_FALLBACK: ServiceTopology = parsedLocalFallback;

export async function loadServiceTopology(): Promise<{
	topology: ServiceTopology;
	source: ServiceTopologySource;
}> {
	const primaryUrl =
		process.env.HOMELAB_TOPOLOGY_API_URL?.trim() || SERVICE_TOPOLOGY_DEFAULT_API_URL;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);

	try {
		const response = await fetch(primaryUrl, {
			headers: { Accept: "application/json" },
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const topology = parseServiceTopology(await response.json());
		if (!topology || topology.nodes.length === 0) throw new Error("Invalid topology payload");
		return { topology, source: "fastapi" };
	} catch {
		return { topology: LOCAL_FALLBACK, source: "local-fallback" };
	} finally {
		clearTimeout(timeout);
	}
}
