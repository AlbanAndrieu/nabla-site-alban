"use client";

import {
	Background,
	Controls,
	type Edge,
	type Node,
	ReactFlow,
} from "@xyflow/react";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";
import type { GuideCopy } from "./content";
import { YUBIKEY_GRAPH_EDGES, YUBIKEY_GRAPH_NODES } from "./model";
import styles from "./page.module.css";

export default function YubiKeyGraphCanvas({
	copy,
	selected,
	onSelect,
}: Readonly<{
	copy: GuideCopy;
	selected: string | null;
	onSelect: (id: string) => void;
}>) {
	const nodes = useMemo<Node[]>(
		() =>
			YUBIKEY_GRAPH_NODES.map((item) => ({
				id: item.id,
				position: { x: item.x, y: item.y },
				data: {
					label: (
						<strong className={styles.graphNodeLabel}>
							{copy.graphRoles[item.id]}
						</strong>
					),
				},
				draggable: false,
				style: {
					width: 190,
					color: "#f8fafc",
					borderRadius: 12,
					border:
						item.id === selected ? "3px solid #fbbf24" : "1px solid #94a3b8",
					background:
						item.kind === "key"
							? "#155e75"
							: item.kind === "recovery"
								? "#4c1d95"
								: "#172b4d",
					padding: "12px 8px",
					textAlign: "center",
				},
			})),
		[copy, selected],
	);
	const edges = useMemo<Edge[]>(
		() =>
			YUBIKEY_GRAPH_EDGES.map((edge) => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: "smoothstep",
				label: copy.graphEdges[edge.id],
				style: {
					stroke:
						edge.source === selected || edge.target === selected
							? "#fbbf24"
							: "#7dd3fc",
					strokeWidth: 2,
				},
				labelStyle: { fill: "#e2e8f0", fontSize: 12 },
				labelBgStyle: { fill: "#0f172a", fillOpacity: 0.96 },
				labelBgPadding: [4, 3],
				labelBgBorderRadius: 4,
			})),
		[copy, selected],
	);
	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			fitView
			fitViewOptions={{ padding: 0.2, maxZoom: 1.05 }}
			nodesFocusable={false}
			edgesFocusable={false}
			nodesDraggable={false}
			nodesConnectable={false}
			onNodeClick={(_, node) => onSelect(node.id)}
			zoomOnScroll={false}
			panOnScroll={false}
			preventScrolling={false}
			minZoom={0.3}
			maxZoom={1.6}
			proOptions={{ hideAttribution: true }}
		>
			<Background color="#334155" bgColor="#020617" gap={24} />
			<Controls showInteractive={false} />
		</ReactFlow>
	);
}
