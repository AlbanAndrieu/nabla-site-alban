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

type NetworkNodeData = Record<string, unknown> & {
	name: string;
	role: string;
	address?: string;
	secondaryAddress?: string;
	icon: string;
	zone: "wan" | "gateway" | "lan" | "wifi";
};

function NetworkNode({ data, selected }: NodeProps) {
	const item = data as NetworkNodeData;
	return (
		<div
			className={`${styles.node} ${styles[item.zone]} ${selected ? styles.selected : ""}`}
		>
			<Handle type="target" position={Position.Top} className={styles.handle} />
			<div className={styles.nodeHeader}>
				<span className={styles.icon} aria-hidden="true">{item.icon}</span>
				<div>
					<strong>{item.name}</strong>
					<span className={styles.role}>{item.role}</span>
				</div>
			</div>
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
		position: { x: 410, y: 0 },
		data: { name: "Internet", role: "WAN", icon: "☁️", zone: "wan" },
	},
	{
		id: "pfsense",
		type: "network",
		position: { x: 370, y: 145 },
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
		id: "switch",
		type: "network",
		position: { x: 390, y: 335 },
		data: { name: "LAN switch", role: "Ethernet fabric", icon: "🔀", zone: "lan" },
	},
	{
		id: "truenas",
		type: "network",
		position: { x: 40, y: 525 },
		data: {
			name: "TrueNAS",
			role: "Storage · Apps · Pi-hole",
			address: "172.17.0.24",
			icon: "🗄️",
			zone: "lan",
		},
	},
	{
		id: "workstation",
		type: "network",
		position: { x: 360, y: 525 },
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
		position: { x: 680, y: 525 },
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
		type: "network",
		position: { x: 680, y: 720 },
		data: {
			name: "S24 Ultra",
			role: "Wi-Fi client",
			address: "172.17.0.11",
			icon: "📱",
			zone: "wifi",
		},
	},
];

function edge(
	id: string,
	source: string,
	target: string,
	label: string,
	kind: "wan" | "lan" | "wifi",
): Edge {
	const stroke = kind === "wan" ? "#38bdf8" : kind === "wifi" ? "#f59e0b" : "#4ade80";
	return {
		id,
		source,
		target,
		label,
		markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
		style: { stroke, strokeWidth: 2.3 },
		labelStyle: { fill: "#e2e8f0", fontSize: 11, fontWeight: 700 },
		labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
		labelBgPadding: [5, 3],
		labelBgBorderRadius: 4,
	};
}

const EDGES: Edge[] = [
	edge("internet-pfsense", "internet", "pfsense", "WAN", "wan"),
	edge("pfsense-switch", "pfsense", "switch", "LAN", "lan"),
	edge("switch-truenas", "switch", "truenas", "Ethernet", "lan"),
	edge("switch-workstation", "switch", "workstation", "Ethernet", "lan"),
	edge("switch-r7000", "switch", "r7000", "Ethernet", "lan"),
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
				fitViewOptions={{ padding: 0.14 }}
				minZoom={0.45}
				maxZoom={1.6}
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
			</div>
		</div>
	);
}
