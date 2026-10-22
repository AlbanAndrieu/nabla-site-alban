"use client";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import type {
	ServiceTopology,
	ServiceTopologySource,
} from "@/lib/serviceTopology";
import { ArchitectureDependencyEvidenceLegend } from "./ArchitectureDependencyEvidence";
import styles from "./HierarchicalArchitectureExplorer.module.css";
import {
	ArchitectureExposureContract,
	ArchitectureRelationLegend,
} from "./HierarchicalArchitectureLegends";
import { NODE_TYPES } from "./HierarchicalArchitectureNodes";
import HierarchicalArchitectureToolbar from "./HierarchicalArchitectureToolbar";
import type { ArchitectureNodeData } from "./hierarchicalArchitectureModel";
import type { ArchitectureHealthSource } from "./useArchitectureHealthPolling";
import useHierarchicalArchitectureGraph from "./useHierarchicalArchitectureGraph";

type Props = {
	locale: string;
	catalog: HomelabServicesCatalog;
	catalogSource: string;
	topology: ServiceTopology;
	topologySource: ServiceTopologySource;
	healthStatus: HomelabHealthSnapshot | null;
	healthSource: ArchitectureHealthSource;
	readOnly?: boolean;
};

export default function HierarchicalArchitectureExplorer({
	locale,
	catalog,
	catalogSource,
	topology,
	topologySource,
	healthStatus,
	healthSource,
	readOnly = false,
}: Readonly<Props>) {
	const french = locale === "fr";
	const {
		mode,
		setMode,
		scope,
		setScope,
		showOptional,
		setShowOptional,
		query,
		setQuery,
		runtimeSource,
		filtered,
		groups,
		nodes,
		edges,
		availability,
	} = useHierarchicalArchitectureGraph({
		french,
		catalog,
		topology,
		healthStatus,
		readOnly,
	});

	return (
		<section
			className={styles.explorer}
			aria-label={
				french
					? "Explorateur d’architecture hiérarchique"
					: "Hierarchical architecture explorer"
			}
			data-hierarchical-architecture-explorer
		>
			<HierarchicalArchitectureToolbar
				french={french}
				mode={mode}
				onModeChange={setMode}
				scope={scope}
				onScopeChange={setScope}
				showOptional={showOptional}
				onShowOptionalChange={setShowOptional}
				query={query}
				onQueryChange={setQuery}
			/>

			<div className={styles.status} role="status">
				<strong>{filtered.entities.length}</strong> {french ? "nœuds" : "nodes"}{" "}
				· <strong>{groups.length}</strong> {french ? "groupes" : "groups"} ·{" "}
				<strong>{edges.length}</strong> relations
				{mode === "services" ? (
					<span>
						{" "}
						· catalog: {catalogSource} · topology: {topologySource} · runtime:{" "}
						{runtimeSource}
						{availability ? ` (${availability})` : ""} · health: {healthSource}
					</span>
				) : null}
			</div>

			<ArchitectureRelationLegend french={french} />
			{mode === "services" ? (
				<ArchitectureDependencyEvidenceLegend french={french} />
			) : null}

			{mode === "services" ? (
				<ArchitectureExposureContract french={french} />
			) : null}

			<p
				id="architecture-flow-interaction-hint"
				className={styles.flowInteractionHint}
			>
				<i className="fas fa-computer-mouse" aria-hidden="true" />{" "}
				{french
					? "La molette fait défiler la page. Utilisez Ctrl/Cmd + molette ou les contrôles +/− pour zoomer dans le diagramme."
					: "The wheel scrolls the page. Use Ctrl/Cmd + wheel or the +/− controls to zoom the diagram."}
			</p>
			<div className={styles.flowShell}>
				<ReactFlow
					key={`${mode}-${scope}`}
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					colorMode="dark"
					fitView
					fitViewOptions={{ padding: 0.05 }}
					nodesDraggable={false}
					nodesConnectable={false}
					deleteKeyCode={null}
					zoomOnScroll={false}
					panOnScroll={false}
					preventScrolling={false}
					zoomActivationKeyCode={["Control", "Meta"]}
					minZoom={0.1}
					maxZoom={1.8}
					proOptions={{ hideAttribution: true }}
					aria-describedby="architecture-flow-interaction-hint"
					aria-label={
						french
							? "Topologie interactive hiérarchisée et groupée"
							: "Grouped hierarchical interactive topology"
					}
				>
					<MiniMap
						pannable
						zoomable
						bgColor="#0f172a"
						maskColor="rgb(2 6 23 / 74%)"
						nodeColor={(node) => {
							if (node.type === "architectureGroup") return "#1e293b";
							const data = node.data as ArchitectureNodeData;
							return data.healthState
								? homelabHealthColor(data.healthState)
								: "#38bdf8";
						}}
						nodeStrokeColor="#e0f2fe"
						nodeStrokeWidth={1}
						className={styles.miniMap}
					/>
					<Controls className={styles.flowControls} showInteractive={false} />
					<Background color="#334155" bgColor="#020617" gap={20} size={1.2} />
				</ReactFlow>
			</div>
			<p className={styles.legend}>
				{mode === "services"
					? french
						? "Les swimlanes reprennent les niveaux de criticité de Critical dependency hierarchy. Les flèches requises remontent des consommateurs vers leurs cibles ; leur état blocked/degraded/unconfirmed vient de l’évidence FastAPI côté consommateur. Déclaré ≠ observé ≠ sain : une cible verte ne confirme pas à elle seule la relation."
						: "Swimlanes reuse the Critical dependency hierarchy tiers. Required arrows point from consumers toward their targets; blocked/degraded/unconfirmed state comes from consumer-side FastAPI evidence. Declared ≠ observed ≠ healthy: a green target alone does not confirm the relation."
					: french
						? "AI Platform est regroupé par couches fonctionnelles. Le flux principal descend des interfaces vers le control plane, l’inférence, les outils, l’orchestration et l’observabilité ; la sémantique des arêtes reste distincte de leur caractère requis ou optionnel."
						: "AI Platform is grouped by functional layers. The main flow moves from interfaces through control plane, inference, tools, orchestration and observability; edge semantics remain distinct from required/optional strength."}
			</p>
		</section>
	);
}
