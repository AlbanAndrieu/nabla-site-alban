"use client";

import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	type Node,
	type NodeProps,
	type NodeTypes,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import styles from "./HierarchicalHomeLabNetworkFlow.module.css";

type NetworkZone =
	| "wan"
	| "gateway"
	| "lan"
	| "wifi"
	| "cloudflare"
	| "proxy"
	| "container"
	| "app";
type PathMode = "all" | "direct" | "tunnel" | "lan";
type LinkKind = "wan" | "lan" | "wifi" | "direct" | "tunnel" | "dns";
type FailureDomain = "external" | "gateway" | "lan" | "truenas";

type NetworkNodeData = Record<string, unknown> & {
	name: string;
	role: string;
	address?: string;
	secondaryAddress?: string;
	badge?: string;
	icon: string;
	zone: NetworkZone;
};

type GroupNodeData = Record<string, unknown> & {
	label: string;
	description: string;
	domain: FailureDomain;
	count: number;
};

type NetworkNodeSpec = {
	id: string;
	domain: FailureDomain;
	data: NetworkNodeData;
};

type NetworkEdgeSpec = {
	id: string;
	source: string;
	target: string;
	label: string;
	kind: LinkKind;
};

const NODE_WIDTH = 232;
const NODE_ROW_HEIGHT = 176;
const GROUP_WIDTH = 1120;
const GROUP_PADDING = 34;
const GROUP_HEADER = 72;
const GROUP_GAP = 34;
const COLUMN_GAP = 30;
const MAX_COLUMNS = 4;

const LINK_STYLES: Record<
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

const DOMAIN_ORDER: readonly FailureDomain[] = [
	"external",
	"gateway",
	"lan",
	"truenas",
];

const NODES: NetworkNodeSpec[] = [
	{
		id: "internet",
		domain: "external",
		data: { name: "Internet", role: "Public WAN", icon: "🌍", zone: "wan" },
	},
	{
		id: "cloudflare-dns",
		domain: "external",
		data: {
			name: "Cloudflare DNS",
			role: "Public DNS / edge",
			address: "garage.int + s3.int",
			badge: "DNS ONLY",
			icon: "☁️",
			zone: "cloudflare",
		},
	},
	{
		id: "cloudflare-tunnel",
		domain: "external",
		data: {
			name: "Cloudflare Tunnel",
			role: "Managed ingress",
			address: "OpenWebUI route",
			badge: "TUNNEL",
			icon: "🔐",
			zone: "cloudflare",
		},
	},
	{
		id: "pfsense",
		domain: "gateway",
		data: {
			name: "pfSense",
			role: "Gateway · DHCP · DNS",
			address: "WAN 82.66.4.247",
			secondaryAddress: "LAN 172.17.0.1",
			icon: "🛡️",
			zone: "gateway",
		},
	},
	{
		id: "haproxy",
		domain: "gateway",
		data: {
			name: "HAProxy",
			role: "pfSense reverse proxy",
			address: "truenas.albandrieu.com:7000",
			secondaryAddress: "Traefik backend 172.17.0.24:443",
			badge: "DIRECT",
			icon: "↔️",
			zone: "proxy",
		},
	},
	{
		id: "switch",
		domain: "lan",
		data: {
			name: "LAN switch",
			role: "Ethernet fabric",
			icon: "🔀",
			zone: "lan",
		},
	},
	{
		id: "workstation",
		domain: "lan",
		data: {
			name: "Workstation",
			role: "LAN client",
			address: "172.17.0.57",
			icon: "🖥️",
			zone: "lan",
		},
	},
	{
		id: "r7000",
		domain: "lan",
		data: {
			name: "R7000 AP",
			role: "Wi-Fi access point",
			address: "172.17.0.12",
			icon: "📶",
			zone: "wifi",
		},
	},
	{
		id: "s24",
		domain: "lan",
		data: {
			name: "S24 Ultra",
			role: "Wi-Fi client",
			address: "172.17.0.11",
			icon: "📱",
			zone: "wifi",
		},
	},
	{
		id: "truenas",
		domain: "truenas",
		data: {
			name: "TrueNAS",
			role: "Storage · Apps · Docker",
			address: "172.17.0.24",
			secondaryAddress: "HTTPS/API :7000",
			badge: "FAILURE DOMAIN",
			icon: "🗄️",
			zone: "lan",
		},
	},
	{
		id: "homarr",
		domain: "truenas",
		data: {
			name: "Homarr",
			role: "Native TrueNAS community App",
			address: "172.17.0.24:30100",
			secondaryAddress: "community/homarr",
			badge: "NATIVE APP",
			icon: "🏠",
			zone: "app",
		},
	},
	{
		id: "traefik",
		domain: "truenas",
		data: {
			name: "Traefik",
			role: "Docker reverse proxy on TrueNAS",
			address: "172.17.0.24:80 / :443",
			secondaryAddress: "traefik_network · Let's Encrypt",
			badge: "DOCKER · DIRECT",
			icon: "🚦",
			zone: "container",
		},
	},
	{
		id: "garage",
		domain: "truenas",
		data: {
			name: "Garage",
			role: "Docker S3 storage + WebUI on TrueNAS",
			address: "s3.int.albandrieu.com → :3900",
			secondaryAddress: "garage.int.albandrieu.com → :3909",
			badge: "TRAEFIK · DNS ONLY",
			icon: "🪣",
			zone: "app",
		},
	},
	{
		id: "cloudflared",
		domain: "truenas",
		data: {
			name: "cloudflared",
			role: "Docker container on TrueNAS",
			address: "172.17.0.24",
			badge: "DOCKER",
			icon: "🐳",
			zone: "container",
		},
	},
	{
		id: "openwebui",
		domain: "truenas",
		data: {
			name: "OpenWebUI",
			role: "TrueNAS-hosted AI web UI",
			address: "open-webui.albandrieu.com",
			secondaryAddress: "172.17.0.24:31028",
			badge: "CLOUDFLARE TUNNEL",
			icon: "💬",
			zone: "app",
		},
	},
];

const EDGES: NetworkEdgeSpec[] = [
	{ id: "internet-pfsense", source: "internet", target: "pfsense", label: "WAN direct", kind: "wan" },
	{ id: "cloudflare-dns-pfsense", source: "cloudflare-dns", target: "pfsense", label: "garage.int + s3.int · DNS only", kind: "dns" },
	{ id: "cloudflare-dns-tunnel", source: "cloudflare-dns", target: "cloudflare-tunnel", label: "proxied hostname", kind: "tunnel" },
	{ id: "pfsense-switch", source: "pfsense", target: "switch", label: "LAN", kind: "lan" },
	{ id: "pfsense-haproxy", source: "pfsense", target: "haproxy", label: "direct HTTPS ingress", kind: "direct" },
	{ id: "switch-truenas", source: "switch", target: "truenas", label: "Ethernet", kind: "lan" },
	{ id: "switch-workstation", source: "switch", target: "workstation", label: "Ethernet", kind: "lan" },
	{ id: "switch-r7000", source: "switch", target: "r7000", label: "Ethernet", kind: "lan" },
	{ id: "haproxy-truenas", source: "haproxy", target: "truenas", label: "TrueNAS :7000", kind: "direct" },
	{ id: "haproxy-traefik", source: "haproxy", target: "traefik", label: "Traefik backend :443", kind: "direct" },
	{ id: "truenas-homarr", source: "truenas", target: "homarr", label: "native App", kind: "lan" },
	{ id: "truenas-traefik", source: "truenas", target: "traefik", label: "Docker host :80/:443", kind: "lan" },
	{ id: "truenas-garage", source: "truenas", target: "garage", label: "Docker host :3900/:3909", kind: "lan" },
	{ id: "traefik-garage", source: "traefik", target: "garage", label: "S3 :3900 · WebUI :3909", kind: "direct" },
	{ id: "truenas-cloudflared", source: "truenas", target: "cloudflared", label: "Docker host", kind: "lan" },
	{ id: "cloudflare-tunnel-cloudflared", source: "cloudflare-tunnel", target: "cloudflared", label: "encrypted tunnel", kind: "tunnel" },
	{ id: "cloudflared-openwebui", source: "cloudflared", target: "openwebui", label: "tunnel ingress", kind: "tunnel" },
	{ id: "r7000-s24", source: "r7000", target: "s24", label: "Wi-Fi", kind: "wifi" },
];

const PATH_NODE_IDS: Record<PathMode, Set<string>> = {
	all: new Set(NODES.map((node) => node.id)),
	direct: new Set(["internet", "cloudflare-dns", "pfsense", "haproxy", "truenas", "traefik", "garage"]),
	tunnel: new Set(["cloudflare-dns", "cloudflare-tunnel", "truenas", "cloudflared", "openwebui"]),
	lan: new Set(["pfsense", "switch", "truenas", "workstation", "r7000", "s24", "homarr", "traefik", "garage"]),
};

function domainCopy(
	domain: FailureDomain,
	french: boolean,
): [string, string] {
	const en: Record<FailureDomain, [string, string]> = {
		external: ["1 · External / WAN", "Public Internet, DNS and managed Cloudflare edge."],
		gateway: ["2 · Gateway & ingress", "pfSense is the LAN authority; HAProxy handles direct HTTPS ingress and routes TrueNAS :7000 plus the Traefik :443 backend."],
		lan: ["3 · LAN access", "Ethernet/Wi-Fi fabric and trusted client devices."],
		truenas: ["4 · TrueNAS failure domain", "Storage host plus native Apps, Traefik/cloudflared Docker ingress and hosted services."],
	};
	const fr: Record<FailureDomain, [string, string]> = {
		external: ["1 · Externe / WAN", "Internet public, DNS et edge Cloudflare managé."],
		gateway: ["2 · Gateway & ingress", "pfSense reste l’autorité LAN ; HAProxy porte l’ingress HTTPS direct et route TrueNAS :7000 ainsi que le backend Traefik :443."],
		lan: ["3 · Accès LAN", "Réseau Ethernet/Wi-Fi et clients de confiance."],
		truenas: ["4 · Domaine de panne TrueNAS", "Hôte stockage, Apps natives, ingress Docker Traefik/cloudflared et services hébergés."],
	};
	return (french ? fr : en)[domain];
}

function NetworkGroupNode({ data }: NodeProps) {
	const item = data as GroupNodeData;
	return (
		<div className={styles.groupNode} data-failure-domain={item.domain}>
			<div className={styles.groupHeading}>
				<div>
					<strong>{item.label}</strong>
					<span>{item.description}</span>
				</div>
				<span className={styles.groupCount}>{item.count} nodes</span>
			</div>
		</div>
	);
}

function NetworkNode({ data, selected }: NodeProps) {
	const item = data as NetworkNodeData;
	return (
		<div
			className={`${styles.node} ${styles[item.zone]} ${selected ? styles.selected : ""}`}
		>
			<Handle type="target" position={Position.Top} className={styles.handle} />
			<div className={styles.nodeHeader}>
				<span className={styles.icon} aria-hidden="true">
					{item.icon}
				</span>
				<div>
					<strong>{item.name}</strong>
					<span className={styles.role}>{item.role}</span>
				</div>
			</div>
			{item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
			{item.address ? <code>{item.address}</code> : null}
			{item.secondaryAddress ? <code>{item.secondaryAddress}</code> : null}
			<Handle type="source" position={Position.Bottom} className={styles.handle} />
		</div>
	);
}

const NODE_TYPES: NodeTypes = {
	network: NetworkNode,
	networkGroup: NetworkGroupNode,
};

function buildNodes(visibleIds: Set<string>, french: boolean): Node[] {
	const nodes: Node[] = [];
	let y = 0;
	for (const domain of DOMAIN_ORDER) {
		const domainNodes = NODES.filter(
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
			data: { label, description, domain, count: domainNodes.length } satisfies GroupNodeData,
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

function buildEdges(visibleIds: Set<string>): Edge[] {
	return EDGES.filter(
		(edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
	).map((edge) => {
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

export default function HierarchicalHomeLabNetworkFlow() {
	const french = useLocale() === "fr";
	const [pathMode, setPathMode] = useState<PathMode>("all");
	const visibleIds = PATH_NODE_IDS[pathMode];
	const nodes = useMemo(() => buildNodes(visibleIds, french), [french, visibleIds]);
	const edges = useMemo(() => buildEdges(visibleIds), [visibleIds]);

	const labels: Record<PathMode, string> = french
		? { all: "Tout", direct: "Ingress direct", tunnel: "Tunnel", lan: "LAN / Wi-Fi" }
		: { all: "All paths", direct: "Direct ingress", tunnel: "Tunnel", lan: "LAN / Wi-Fi" };

	return (
		<div className={styles.wrapper} data-hierarchical-homelab-network>
			<div className={styles.toolbar}>
				<div>
					<strong>{french ? "Chemin à isoler" : "Focus path"}</strong>
					<span>
						{french
							? "Les cadres sont des domaines de panne, pas de simples catégories visuelles."
							: "Frames are failure domains, not just visual categories."}
					</span>
				</div>
				<div className={styles.pathTabs} role="group" aria-label="Network path filter">
					{(["all", "direct", "tunnel", "lan"] as const).map((mode) => (
						<button
							key={mode}
							type="button"
							aria-pressed={pathMode === mode}
							onClick={() => setPathMode(mode)}
						>
							{labels[mode]}
						</button>
					))}
				</div>
			</div>
			<div className={styles.shell} aria-label="Interactive grouped homelab network topology">
				<ReactFlow
					key={pathMode}
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					fitView
					fitViewOptions={{ padding: 0.05 }}
					minZoom={0.16}
					maxZoom={1.8}
					nodesDraggable={false}
					nodesConnectable={false}
					deleteKeyCode={null}
					proOptions={{ hideAttribution: true }}
				>
					<Background color="#334155" gap={24} size={1} />
					<Controls className={styles.controls} showInteractive={false} />
				</ReactFlow>
				<div className={styles.legend} aria-label="Network link legend">
					<span><i className={styles.wanDot} />WAN</span>
					<span><i className={styles.lanDot} />LAN / hosting</span>
					<span><i className={styles.wifiDot} />Wi-Fi</span>
					<span><i className={styles.haproxyDot} />Direct reverse proxy (HAProxy / Traefik)</span>
					<span><i className={styles.tunnelDot} />Cloudflare Tunnel</span>
					<span><i className={styles.dnsDot} />Cloudflare DNS only</span>
				</div>
			</div>
		</div>
	);
}
