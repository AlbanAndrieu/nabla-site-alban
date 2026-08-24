"use client";

import {
	Background,
	Controls,
	Handle,
	MarkerType,
	MiniMap,
	Position,
	ReactFlow,
	type Edge,
	type Node,
	type NodeProps,
	type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import type { ServiceTopology, ServiceTopologySource } from "@/lib/serviceTopology";
import {
	AI_ENTITIES,
	AI_RELATIONS,
	type ArchitectureEntity,
	type ArchitectureRelation,
	buildNablaEntities,
	buildNablaRelations,
} from "./architectureData";
import styles from "./ArchitectureExplorer.module.css";

type GraphMode = "ai" | "services";

type ArchitectureNodeData = Record<string, unknown> & {
	name: string;
	kind: string;
	category: string;
	url?: string;
	detail?: string;
	openLabel: string;
};

type Props = {
	locale: string;
	catalog: HomelabServicesCatalog;
	catalogSource: string;
	topology: ServiceTopology;
	topologySource: ServiceTopologySource;
};

function ArchitectureNode({ data, selected }: NodeProps) {
	const item = data as ArchitectureNodeData;
	return (
		<div className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}>
			<Handle type="target" position={Position.Left} className={styles.handle} />
			<div className={styles.nodeMeta}>
				<span>{item.category}</span>
				<span>{item.kind}</span>
			</div>
			<strong className={styles.nodeTitle}>{item.name}</strong>
			{item.detail ? <small className={styles.nodeDetail}>{item.detail}</small> : null}
			{item.url ? (
				<a
					className={`${styles.openLink} nodrag nopan`}
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(event) => event.stopPropagation()}
				>
					{item.openLabel} ↗
				</a>
			) : null}
			<Handle type="source" position={Position.Right} className={styles.handle} />
		</div>
	);
}

const NODE_TYPES: NodeTypes = { architecture: ArchitectureNode };

function layerPositions(entities: ArchitectureEntity[]): Map<string, { x: number; y: number }> {
	const positions = new Map<string, { x: number; y: number }>();
	const layers = new Map<number, ArchitectureEntity[]>();
	for (const entity of entities) {
		const layer = entity.layer ?? 0;
		layers.set(layer, [...(layers.get(layer) ?? []), entity]);
	}
	for (const [layer, items] of layers) {
		const width = Math.max(1, items.length - 1) * 250;
		items.forEach((entity, index) => {
			positions.set(entity.id, { x: 850 - width / 2 + index * 250, y: layer * 190 });
		});
	}
	return positions;
}

function gridPositions(entities: ArchitectureEntity[]): Map<string, { x: number; y: number }> {
	const positions = new Map<string, { x: number; y: number }>();
	const sorted = [...entities].sort(
		(a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
	);
	const columns = 6;
	sorted.forEach((entity, index) => {
		positions.set(entity.id, {
			x: (index % columns) * 280,
			y: Math.floor(index / columns) * 150,
		});
	});
	return positions;
}

function makeNodes(
	entities: ArchitectureEntity[],
	mode: GraphMode,
	openLabel: string,
): Node<ArchitectureNodeData>[] {
	const positions = mode === "ai" ? layerPositions(entities) : gridPositions(entities);
	return entities.map((entity) => ({
		id: entity.id,
		type: "architecture",
		position: positions.get(entity.id) ?? { x: 0, y: 0 },
		data: {
			name: entity.name,
			kind: entity.kind,
			category: entity.category,
			url: entity.url,
			detail: entity.detail,
			openLabel,
		},
	}));
}

function makeEdges(relations: ArchitectureRelation[], visible: Set<string>): Edge[] {
	return relations
		.filter((relation) => visible.has(relation.source) && visible.has(relation.target))
		.map((relation, index) => ({
			id: `${relation.source}-${relation.type}-${relation.target}-${index}`,
			source: relation.source,
			target: relation.target,
			label: relation.type,
			animated: !relation.optional,
			markerEnd: { type: MarkerType.ArrowClosed },
			className: relation.optional ? styles.edgeOptional : styles.edgeRequired,
		}));
}

function filterGraph(
	entities: ArchitectureEntity[],
	relations: ArchitectureRelation[],
	query: string,
): { entities: ArchitectureEntity[]; visible: Set<string> } {
	const needle = query.trim().toLowerCase();
	if (!needle) return { entities, visible: new Set(entities.map((entity) => entity.id)) };

	const matches = new Set(
		entities
			.filter((entity) =>
				`${entity.name} ${entity.kind} ${entity.category}`.toLowerCase().includes(needle),
			)
			.map((entity) => entity.id),
	);
	for (const relation of relations) {
		if (matches.has(relation.source)) matches.add(relation.target);
		if (matches.has(relation.target)) matches.add(relation.source);
	}
	return {
		entities: entities.filter((entity) => matches.has(entity.id)),
		visible: matches,
	};
}

export default function ArchitectureExplorer({
	locale,
	catalog,
	catalogSource,
	topology,
	topologySource,
}: Readonly<Props>) {
	const french = locale === "fr";
	const [mode, setMode] = useState<GraphMode>("ai");
	const [query, setQuery] = useState("");

	const servicesEntities = useMemo(
		() => buildNablaEntities(catalog.services, topology),
		[catalog.services, topology],
	);
	const servicesRelations = useMemo(() => buildNablaRelations(topology), [topology]);
	const entities = mode === "ai" ? AI_ENTITIES : servicesEntities;
	const relations = mode === "ai" ? AI_RELATIONS : servicesRelations;
	const filtered = useMemo(() => filterGraph(entities, relations, query), [entities, relations, query]);
	const nodes = useMemo(
		() => makeNodes(filtered.entities, mode, french ? "Ouvrir" : "Open"),
		[filtered.entities, french, mode],
	);
	const edges = useMemo(
		() => makeEdges(relations, filtered.visible),
		[relations, filtered.visible],
	);

	return (
		<section className={styles.explorer} aria-labelledby="architecture-explorer-heading">
			<div className={styles.toolbar}>
				<div className={styles.tabs} role="group" aria-label={french ? "Vue du diagramme" : "Diagram view"}>
					<button type="button" aria-pressed={mode === "ai"} onClick={() => setMode("ai")}>
						AI Platform
					</button>
					<button type="button" aria-pressed={mode === "services"} onClick={() => setMode("services")}>
						Nabla / TrueNAS
					</button>
				</div>
				<label className={styles.search}>
					<span>{french ? "Filtrer" : "Filter"}</span>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={french ? "service, catégorie…" : "service, category…"}
					/>
				</label>
			</div>

			<div className={styles.status} role="status">
				<strong>{filtered.entities.length}</strong> {french ? "nœuds" : "nodes"} · <strong>{edges.length}</strong>{" "}
				{french ? "relations" : "relations"}
				{mode === "services" ? (
					<span>
						{" "}· catalog: {catalogSource} · topology: {topologySource}
					</span>
				) : null}
			</div>

			<div className={styles.flowShell} id="architecture-explorer-heading">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					fitView
					fitViewOptions={{ padding: 0.18 }}
					nodesConnectable={false}
					deleteKeyCode={null}
					minZoom={0.08}
					maxZoom={1.8}
					aria-label={french ? "Topologie interactive des services" : "Interactive service topology"}
				>
					<MiniMap pannable zoomable />
					<Controls />
					<Background gap={20} size={1} />
				</ReactFlow>
			</div>
			<p className={styles.legend}>
				{french
					? "Les flèches animées représentent les relations requises ; les relations optionnelles restent statiques. Le bouton Ouvrir utilise l’URL publique quand elle existe, sinon l’endpoint interne connu."
					: "Animated arrows represent required relations; optional relations remain static. Open uses the public URL when available, otherwise the known internal endpoint."}
			</p>
		</section>
	);
}
