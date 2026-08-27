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
import styles from "./HomeLabNetworkFlow.module.css";

type NetworkZone =
	| "wan"
	| "gateway"
	| "lan"
	| "wifi"
	| "cloudflare"
	| "proxy"
	| "container"
	| "app";

type NetworkNodeData = Record<string, unknown> & {
	name: string;
	role: string;
	address?: string;
	secondaryAddress?: string;
	badge?: string;
	icon: string;
	zone: NetworkZone;
};

type LinkKind = "wan" | "lan" | "wifi" | "haproxy" | "tunnel" | "dns";

const LINK_STYLES: Record<
	LinkKind,
	{ color: string; dash?: string; animated?: boolean }
> = {
	wan: { color: "#38bdf8" },
	lan: { color: "#4ade80" },
	wifi: { color: "#f59e0b" },
	haproxy: { color: "#c084fc" },
	tunnel: { color: "#fb923c", dash: "8 6", animated: true },
	dns: { color: "#a3e635", dash: "4 6" },
};

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

const NODE_TYPES: NodeTypes = { network: NetworkNode };

const NODES: Node<NetworkNodeData>[] = [
	{
		id: "internet",
		type: "network",
		position: { x: 500, y: 0 },
		data: { name: "Internet", role: "Public WAN", icon: "🌍", zone: "wan" },
	},
	{
		id: "cloudflare-dns",
		type: "network",
		position: { x: 900, y: 0 },
		data: {
			name: "Cloudflare DNS",
			role: "Public DNS / edge",
			address: "int.albandrieu.com",
			badge: "DNS",
			icon: "☁️",
			zone: "cloudflare",
		},
	},
	{
		id: "pfsense",
		type: "network",
		position: { x: 500, y: 165 },
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
		id: "cloudflare-tunnel",
		type: "network",
		position: { x: 900, y: 165 },
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
		id: "switch",
		type: "network",
		position: { x: 40, y: 360 },
		data: {
			name: "LAN switch",
			role: "Ethernet fabric",
			icon: "🔀",
			zone: "lan",
		},
	},
	{
		id: "haproxy",
		type: "network",
		position: { x: 405, y: 360 },
		data: {
			name: "HAProxy",
			role: "pfSense reverse proxy",
			address: "TrueNAS HTTPS :7000",
			secondaryAddress: "Garage direct ingress",
			badge: "DIRECT",
			icon: "↔️",
			zone: "proxy",
		},
	},
	{
		id: "truenas",
		type: "network",
		position: { x: 700, y: 360 },
		data: {
			name: "TrueNAS",
			role: "Storage · Apps · Docker",
			address: "172.17.0.24",
			secondaryAddress: "HTTPS/API :7000",
			icon: "🗄️",
			zone: "lan",
		},
	},
	{
		id: "workstation",
		type: "network",
		position: { x: 0, y: 575 },
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
		type: "network",
		position: { x: 250, y: 575 },
		data: {
			name: "R7000 AP",
			role: "Wi-Fi access point",
			address: "172.17.0.12",
			icon: "📶",
			zone: "wifi",
		},
	},
	{
		id: "homarr",
		type: "network",
		position: { x: 500, y: 575 },
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
		id: "garage",
		type: "network",
		position: { x: 750, y: 575 },
		data: {
			name: "Garage",
			role: "TrueNAS service · direct HAProxy",
			address: "garage.int.albandrieu.com",
			secondaryAddress: "172.17.0.24:3909",
			badge: "DNS ONLY · NO TUNNEL",
			icon: "🪣",
			zone: "app",
		},
	},
	{
		id: "cloudflared",
		type: "network",
		position: { x: 1000, y: 575 },
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
		id: "s24",
		type: "network",
		position: { x: 250, y: 790 },
		data: {
			name: "S24 Ultra",
			role: "Wi-Fi client",
			address: "172.17.0.11",
			icon: "📱",
			zone: "wifi",
		},
	},
	{
		id: "openwebui",
		type: "network",
		position: { x: 1000, y: 790 },
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

function edge(
	id: string,
	source: string,
	target: string,
	label: string,
	kind: LinkKind,
): Edge {
	const link = LINK_STYLES[kind];
	return {
		id,
		source,
		target,
		label,
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
}

const EDGES: Edge[] = [
	edge("internet-pfsense", "internet", "pfsense", "WAN direct", "wan"),
	edge("cloudflare-dns-pfsense", "cloudflare-dns", "pfsense", "garage.int · DNS only", "dns"),
	edge("cloudflare-dns-tunnel", "cloudflare-dns", "cloudflare-tunnel", "proxied hostname", "tunnel"),
	edge("pfsense-switch", "pfsense", "switch", "LAN", "lan"),
	edge("pfsense-haproxy", "pfsense", "haproxy", "published HTTPS", "haproxy"),
	edge("switch-truenas", "switch", "truenas", "Ethernet", "lan"),
	edge("switch-workstation", "switch", "workstation", "Ethernet", "lan"),
	edge("switch-r7000", "switch", "r7000", "Ethernet", "lan"),
	edge("haproxy-truenas", "haproxy", "truenas", "TrueNAS :7000", "haproxy"),
	edge("truenas-homarr", "truenas", "homarr", "native App", "lan"),
	edge("truenas-garage", "truenas", "garage", "service :3909", "lan"),
	edge("haproxy-garage", "haproxy", "garage", "direct reverse proxy", "haproxy"),
	edge("truenas-cloudflared", "truenas", "cloudflared", "Docker host", "lan"),
	edge("cloudflare-tunnel-cloudflared", "cloudflare-tunnel", "cloudflared", "encrypted tunnel", "tunnel"),
	edge("cloudflared-openwebui", "cloudflared", "openwebui", "tunnel ingress", "tunnel"),
	edge("r7000-s24", "r7000", "s24", "Wi-Fi", "wifi"),
];

export default function HomeLabNetworkFlow() {
	return (
		<div className={styles.shell} aria-label="Interactive homelab network topology">
			<ReactFlow
				nodes={NODES}
				edges={EDGES}
				nodeTypes={NODE_TYPES}
				fitView
				fitViewOptions={{ padding: 0.1 }}
				minZoom={0.3}
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
				<span><i className={styles.lanDot} />LAN</span>
				<span><i className={styles.wifiDot} />Wi-Fi</span>
				<span><i className={styles.haproxyDot} />HAProxy direct</span>
				<span><i className={styles.tunnelDot} />Cloudflare Tunnel</span>
				<span><i className={styles.dnsDot} />Cloudflare DNS only</span>
			</div>
		</div>
	);
}
