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
type PathMode = "all" | "direct" | "tunnel" | "dns" | "lan";
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
		id: "wan-switch",
		domain: "external",
		data: {
			name: "WAN switch",
			role: "ISP / WAN transit",
			address: "Public edge ↔ pfSense WAN",
			badge: "WAN TRANSIT",
			icon: "🔀",
			zone: "wan",
		},
	},
	{
		id: "public-dns",
		domain: "external",
		data: {
			name: "Public DNS",
			role: "Recursive authorities / public fallback",
			address: "Quad9 9.9.9.9",
			secondaryAddress: "Cloudflare 1.1.1.1",
			badge: "PUBLIC ONLY",
			icon: "🌐",
			zone: "cloudflare",
		},
	},
	{
		id: "cloudflare-dns",
		domain: "external",
		data: {
			name: "Cloudflare DNS",
			role: "Public DNS / edge",
			address: "s3.int only",
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
			address: "garage + garage-admin + OpenWebUI",
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
			role: "Gateway · DHCP · firewall",
			address: "WAN 82.66.4.247",
			secondaryAddress: "LAN 172.17.0.1",
			icon: "🛡️",
			zone: "gateway",
		},
	},
	{
		id: "unbound",
		domain: "gateway",
		data: {
			name: "Unbound",
			role: "pfSense LAN resolver / split DNS",
			address: "172.17.0.1:53",
			secondaryAddress: "int.albandrieu.com → Pi-hole 172.17.0.24:53",
			badge: "OUTGOING ALL · FORWARDING OFF",
			icon: "📖",
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
		id: "pihole",
		domain: "truenas",
		data: {
			name: "Pi-hole",
			role: "Private DNS authority / filtering",
			address: "172.17.0.24:53",
			secondaryAddress: "*.int.albandrieu.com",
			badge: "DOMAIN OVERRIDE TARGET",
			icon: "🕳️",
			zone: "app",
		},
	},
	{
		id: "pihole-dns-sync",
		domain: "truenas",
		data: {
			name: "Pi-hole DNS Sync",
			role: "Traefik labels → private DNS records",
			address: "TARGET_IP 172.17.0.24",
			secondaryAddress: "DOMAIN_SUFFIX int.albandrieu.com",
			badge: "DNS SYNC",
			icon: "🔁",
			zone: "container",
		},
	},
	{
		id: "garage",
		domain: "truenas",
		data: {
			name: "Garage S3",
			role: "S3 API on TrueNAS",
			address: "s3.int.albandrieu.com → :3900",
			badge: "TRAEFIK · DNS ONLY",
			icon: "🪣",
			zone: "app",
		},
	},
	{
		id: "garage-webui",
		domain: "truenas",
		data: {
			name: "Garage",
			role: "Garage WebUI on TrueNAS",
			address: "garage.albandrieu.com → :3909",
			badge: "CLOUDFLARE TUNNEL",
			icon: "🖥️",
			zone: "app",
		},
	},
	{
		id: "garage-admin",
		domain: "truenas",
		data: {
			name: "Garage Admin",
			role: "Garage Admin API on TrueNAS",
			address: "garage-admin.albandrieu.com → :3903",
			badge: "CLOUDFLARE TUNNEL",
			icon: "🔐",
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
			secondaryAddress: "172.17.0.24:31028 · direct origin",
			badge: "TUNNEL · NO TRAEFIK",
			icon: "💬",
			zone: "app",
		},
	},
];

const EDGES: NetworkEdgeSpec[] = [
	{
		id: "internet-wan-switch",
		source: "internet",
		target: "wan-switch",
		label: "public WAN",
		kind: "wan",
	},
	{
		id: "cloudflare-dns-wan-switch",
		source: "cloudflare-dns",
		target: "wan-switch",
		label: "s3.int · DNS-only public edge",
		kind: "dns",
	},
	{
		id: "cloudflare-dns-tunnel",
		source: "cloudflare-dns",
		target: "cloudflare-tunnel",
		label: "garage + garage-admin + OpenWebUI",
		kind: "tunnel",
	},
	{
		id: "cloudflare-tunnel-wan-switch",
		source: "cloudflare-tunnel",
		target: "wan-switch",
		label: "encrypted tunnel transport over WAN",
		kind: "tunnel",
	},
	{
		id: "wan-switch-pfsense",
		source: "wan-switch",
		target: "pfsense",
		label: "WAN 82.66.4.247",
		kind: "wan",
	},
	{
		id: "pfsense-switch",
		source: "pfsense",
		target: "switch",
		label: "LAN",
		kind: "lan",
	},
	{
		id: "pfsense-unbound",
		source: "pfsense",
		target: "unbound",
		label: "LAN DNS resolver :53",
		kind: "dns",
	},
	{
		id: "pfsense-haproxy",
		source: "pfsense",
		target: "haproxy",
		label: "direct HTTPS ingress",
		kind: "direct",
	},
	{
		id: "haproxy-switch",
		source: "haproxy",
		target: "switch",
		label: "TLS re-encrypted backend via LAN",
		kind: "direct",
	},
	{
		id: "switch-truenas",
		source: "switch",
		target: "truenas",
		label: "Ethernet",
		kind: "lan",
	},
	{
		id: "switch-workstation",
		source: "switch",
		target: "workstation",
		label: "Ethernet",
		kind: "lan",
	},
	{
		id: "switch-r7000",
		source: "switch",
		target: "r7000",
		label: "Ethernet",
		kind: "lan",
	},
	{
		id: "workstation-unbound",
		source: "workstation",
		target: "unbound",
		label: "DNS #1 172.17.0.1",
		kind: "dns",
	},
	{
		id: "truenas-unbound",
		source: "truenas",
		target: "unbound",
		label: "resolver #1 172.17.0.1",
		kind: "dns",
	},
	{
		id: "unbound-pihole",
		source: "unbound",
		target: "pihole",
		label: "*.int Domain Override → :53",
		kind: "dns",
	},
	{
		id: "unbound-public-dns",
		source: "unbound",
		target: "public-dns",
		label: "public recursion · Forwarding OFF",
		kind: "dns",
	},
	{
		id: "truenas-public-dns",
		source: "truenas",
		target: "public-dns",
		label: "fallback #2/#3 · public only",
		kind: "dns",
	},
	{
		id: "truenas-homarr",
		source: "truenas",
		target: "homarr",
		label: "native App",
		kind: "lan",
	},
	{
		id: "truenas-traefik",
		source: "truenas",
		target: "traefik",
		label: "Docker host :80/:443",
		kind: "lan",
	},
	{
		id: "truenas-pihole",
		source: "truenas",
		target: "pihole",
		label: "DNS host :53",
		kind: "lan",
	},
	{
		id: "truenas-pihole-dns-sync",
		source: "truenas",
		target: "pihole-dns-sync",
		label: "Docker host",
		kind: "lan",
	},
	{
		id: "traefik-pihole-dns-sync",
		source: "traefik",
		target: "pihole-dns-sync",
		label: "eligible *.int labels",
		kind: "dns",
	},
	{
		id: "pihole-dns-sync-pihole",
		source: "pihole-dns-sync",
		target: "pihole",
		label: "private A records",
		kind: "dns",
	},
	{
		id: "truenas-garage",
		source: "truenas",
		target: "garage",
		label: "Docker host :3900",
		kind: "lan",
	},
	{
		id: "truenas-garage-webui",
		source: "truenas",
		target: "garage-webui",
		label: "Docker host :3909",
		kind: "lan",
	},
	{
		id: "truenas-garage-admin",
		source: "truenas",
		target: "garage-admin",
		label: "Docker host :3903",
		kind: "lan",
	},
	{
		id: "traefik-garage",
		source: "traefik",
		target: "garage",
		label: "s3.int → S3 :3900",
		kind: "direct",
	},
	{
		id: "truenas-cloudflared",
		source: "truenas",
		target: "cloudflared",
		label: "Docker host",
		kind: "lan",
	},
	{
		id: "cloudflared-garage-webui",
		source: "cloudflared",
		target: "garage-webui",
		label: "garage.albandrieu.com → :3909",
		kind: "tunnel",
	},
	{
		id: "cloudflared-garage-admin",
		source: "cloudflared",
		target: "garage-admin",
		label: "garage-admin.albandrieu.com → :3903",
		kind: "tunnel",
	},
	{
		id: "cloudflared-openwebui",
		source: "cloudflared",
		target: "openwebui",
		label: "open-webui.albandrieu.com → :31028 · no Traefik",
		kind: "tunnel",
	},
	{
		id: "r7000-s24",
		source: "r7000",
		target: "s24",
		label: "Wi-Fi",
		kind: "wifi",
	},
	{
		id: "s24-unbound",
		source: "s24",
		target: "unbound",
		label: "Wi-Fi DNS #1",
		kind: "dns",
	},
];

const PATH_NODE_IDS: Record<PathMode, Set<string>> = {
	all: new Set(NODES.map((node) => node.id)),
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

function domainCopy(domain: FailureDomain, french: boolean): [string, string] {
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
		? {
				all: "Tout",
				direct: "Ingress direct",
				tunnel: "Tunnel",
				dns: "DNS / DNS scindé",
				lan: "LAN / Wi-Fi",
			}
		: {
				all: "All paths",
				direct: "Direct ingress",
				tunnel: "Tunnel",
				dns: "DNS / split DNS",
				lan: "LAN / Wi-Fi",
			};

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
					{(["all", "direct", "tunnel", "dns", "lan"] as const).map((mode) => (
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
			<div
				className={styles.shell}
				aria-label="Interactive grouped homelab network topology"
			>
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
					<span>
						<i className={styles.wanDot} />
						WAN transport
					</span>
					<span>
						<i className={styles.lanDot} />
						LAN / hosting
					</span>
					<span>
						<i className={styles.wifiDot} />
						Wi-Fi
					</span>
					<span>
						<i className={styles.haproxyDot} />
						Direct reverse proxy (HAProxy / Traefik)
					</span>
					<span>
						<i className={styles.tunnelDot} />
						Cloudflare Tunnel
					</span>
					<span>
						<i className={styles.dnsDot} />
						DNS resolution / split DNS
					</span>
				</div>
			</div>
		</div>
	);
}
