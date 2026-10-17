"use client";

import {
	Background,
	Controls,
	Handle,
	type NodeProps,
	type NodeTypes,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import styles from "./HierarchicalHomeLabNetworkFlow.module.css";
import {
	buildEdges,
	buildNodes,
	PATH_NODE_IDS,
} from "./homelabNetworkFlowGraph";
import type {
	GroupNodeData,
	NetworkNodeData,
	PathMode,
} from "./homelabNetworkFlowTypes";

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
			<Handle
				type="source"
				position={Position.Bottom}
				className={styles.handle}
			/>
		</div>
	);
}

const NODE_TYPES: NodeTypes = {
	network: NetworkNode,
	networkGroup: NetworkGroupNode,
};

export default function HierarchicalHomeLabNetworkFlow() {
	const french = useLocale() === "fr";
	const [pathMode, setPathMode] = useState<PathMode>("all");
	const visibleIds = PATH_NODE_IDS[pathMode];
	const nodes = useMemo(
		() => buildNodes(visibleIds, french),
		[french, visibleIds],
	);
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
				<div
					className={styles.pathTabs}
					role="group"
					aria-label="Network path filter"
				>
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
