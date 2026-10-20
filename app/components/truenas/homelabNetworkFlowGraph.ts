import { type Edge, MarkerType, type Node } from "@xyflow/react";
import type {
	FailureDomain,
	GroupNodeData,
	LinkKind,
	NetworkEdgeSpec,
	NetworkGraph,
	NetworkNodeSpec,
	PathMode,
} from "./homelabNetworkFlowTypes";

export const NODE_WIDTH = 232;
export const NODE_ROW_HEIGHT = 176;
export const GROUP_WIDTH = 1120;
export const GROUP_PADDING = 34;
export const GROUP_HEADER = 72;
export const GROUP_GAP = 34;
export const COLUMN_GAP = 30;
export const MAX_COLUMNS = 4;

export const LINK_STYLES: Record<
	LinkKind,
	{ color: string; dash?: string; animated?: boolean }
> = {
	wan: { color: "#38bdf8" },
	lan: { color: "#4ade80" },
	wifi: { color: "#f59e0b" },
	direct: { color: "#c084fc" },
	tunnel: { color: "#fb923c", dash: "8 6", animated: true },
	dns: { color: "#a3e635", dash: "4 6" },
};

export const DOMAIN_ORDER: readonly FailureDomain[] = [
	"external",
	"gateway",
	"lan",
	"truenas",
];

/**
 * Node ids of each focused path. The graph itself (addresses, ports, labels)
 * is private: it is fetched from the gated /api/homelab-network-flow route and
 * must never be imported by a client module.
 */
export const PATH_NODE_IDS: Record<Exclude<PathMode, "all">, Set<string>> = {
	direct: new Set([
		"internet",
		"cloudflare-dns",
		"wan-switch",
		"pfsense",
		"haproxy",
		"switch",
		"truenas",
		"traefik",
		"garage",
	]),
	tunnel: new Set([
		"cloudflare-dns",
		"cloudflare-tunnel",
		"wan-switch",
		"pfsense",
		"switch",
		"truenas",
		"cloudflared",
		"garage-webui",
		"garage-admin",
		"openwebui",
	]),
	dns: new Set([
		"internet",
		"public-dns",
		"cloudflare-dns",
		"wan-switch",
		"pfsense",
		"unbound",
		"switch",
		"truenas",
		"workstation",
		"r7000",
		"s24",
		"traefik",
		"pihole",
		"pihole-dns-sync",
	]),
	lan: new Set([
		"pfsense",
		"unbound",
		"switch",
		"truenas",
		"workstation",
		"r7000",
		"s24",
		"homarr",
		"traefik",
		"pihole",
		"pihole-dns-sync",
		"cloudflared",
		"garage",
		"garage-webui",
		"garage-admin",
		"openwebui",
	]),
};

export function visibleNodeIds(
	nodes: readonly NetworkNodeSpec[],
	mode: PathMode,
): Set<string> {
	return mode === "all"
		? new Set(nodes.map((node) => node.id))
		: PATH_NODE_IDS[mode];
}

export function domainCopy(
	domain: FailureDomain,
	french: boolean,
): [string, string] {
	const en: Record<FailureDomain, [string, string]> = {
		external: [
			"1 · External / WAN",
			"Public Internet, WAN transit, public DNS and the managed Cloudflare edge.",
		],
		gateway: [
			"2 · Gateway, ingress & DNS",
			"pfSense owns the LAN boundary; HAProxy handles direct HTTPS and Unbound handles recursive/split DNS.",
		],
		lan: [
			"3 · LAN access",
			"Ethernet/Wi-Fi fabric carrying direct, tunnel-origin and resolver traffic.",
		],
		truenas: [
			"4 · TrueNAS failure domain",
			"Storage host plus Traefik, cloudflared, Pi-hole and the hosted services.",
		],
	};
	const fr: Record<FailureDomain, [string, string]> = {
		external: [
			"1 · Externe / WAN",
			"Internet public, transit WAN, DNS public et edge Cloudflare managé.",
		],
		gateway: [
			"2 · Gateway, ingress & DNS",
			"pfSense porte la frontière LAN ; HAProxy gère HTTPS direct et Unbound le DNS récursif/scindé.",
		],
		lan: [
			"3 · Accès LAN",
			"Réseau Ethernet/Wi-Fi transportant ingress direct, origine tunnel et résolution DNS.",
		],
		truenas: [
			"4 · Domaine de panne TrueNAS",
			"Hôte stockage avec Traefik, cloudflared, Pi-hole et les services hébergés.",
		],
	};
	return (french ? fr : en)[domain];
}

export function buildNodes(
	specs: readonly NetworkNodeSpec[],
	visibleIds: Set<string>,
	french: boolean,
): Node[] {
	const nodes: Node[] = [];
	let y = 0;
	for (const domain of DOMAIN_ORDER) {
		const domainNodes = specs.filter(
			(node) => node.domain === domain && visibleIds.has(node.id),
		);
		if (domainNodes.length === 0) continue;
		const rows = Math.ceil(domainNodes.length / MAX_COLUMNS);
		const groupHeight = GROUP_HEADER + GROUP_PADDING + rows * NODE_ROW_HEIGHT;
		const [label, description] = domainCopy(domain, french);
		const groupId = `network-group-${domain}`;
		nodes.push({
			id: groupId,
			type: "networkGroup",
			position: { x: 0, y },
			data: {
				label,
				description,
				domain,
				count: domainNodes.length,
			} satisfies GroupNodeData,
			style: { width: GROUP_WIDTH, height: groupHeight },
			selectable: false,
			draggable: false,
			zIndex: -1,
		});
		domainNodes.forEach((node, index) => {
			const col = index % MAX_COLUMNS;
			const row = Math.floor(index / MAX_COLUMNS);
			nodes.push({
				id: node.id,
				type: "network",
				parentId: groupId,
				extent: "parent",
				position: {
					x: GROUP_PADDING + col * (NODE_WIDTH + COLUMN_GAP),
					y: GROUP_HEADER + 12 + row * NODE_ROW_HEIGHT,
				},
				data: node.data,
			});
		});
		y += groupHeight + GROUP_GAP;
	}
	return nodes;
}

export function buildEdges(
	specs: readonly NetworkEdgeSpec[],
	visibleIds: Set<string>,
): Edge[] {
	return specs
		.filter(
			(edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
		)
		.map((edge) => {
			const link = LINK_STYLES[edge.kind];
			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				label: edge.label,
				animated: link.animated,
				markerEnd: { type: MarkerType.ArrowClosed, color: link.color },
				style: {
					stroke: link.color,
					strokeWidth: 2.3,
					strokeDasharray: link.dash,
				},
				labelStyle: { fill: "#e2e8f0", fontSize: 11, fontWeight: 700 },
				labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
				labelBgPadding: [5, 3],
				labelBgBorderRadius: 4,
			};
		});
}

const LINK_KINDS = new Set<string>(Object.keys(LINK_STYLES));

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeSpec(value: unknown): value is NetworkNodeSpec {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		DOMAIN_ORDER.includes(value.domain as FailureDomain) &&
		isRecord(value.data) &&
		typeof value.data.name === "string" &&
		typeof value.data.role === "string"
	);
}

function isEdgeSpec(value: unknown): value is NetworkEdgeSpec {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.source === "string" &&
		typeof value.target === "string" &&
		typeof value.label === "string" &&
		LINK_KINDS.has(value.kind as string)
	);
}

/** Validates the gated API payload; anything unexpected renders nothing. */
export function parseNetworkGraph(value: unknown): NetworkGraph | null {
	if (!isRecord(value)) return null;
	const { nodes, edges } = value;
	if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
	if (!nodes.every(isNodeSpec) || !edges.every(isEdgeSpec)) return null;
	return { nodes, edges };
}
