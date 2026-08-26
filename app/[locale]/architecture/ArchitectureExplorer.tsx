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
import { useEffect, useMemo, useState } from "react";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import {
	parseHomelabStatusSnapshot,
	type HomelabStatusService,
	type HomelabStatusSnapshot,
} from "@/lib/homelabStatus";
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
type RuntimeStatusWithFreshness = HomelabStatusSnapshot["runtime"] & { stale?: boolean };

type ArchitectureNodeData = Record<string, unknown> & {
	name: string;
	kind: string;
	category: string;
	url?: string;
	detail?: string;
	icon?: string;
	iconSrc?: string;
	openLabel: string;
	reconciliation?: string;
	runtimeState?: string;
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
	const fallback = item.name.trim().slice(0, 2).toUpperCase();
	return (
		<div
			className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}
			data-reconciliation={item.reconciliation}
		>
			<Handle type="target" position={Position.Left} className={styles.handle} />
			<div className={styles.nodeMeta}>
				<span>{item.category}</span>
				<span>{item.kind}</span>
			</div>
			<div className={styles.nodeHeading}>
				<span className={styles.nodeIconFrame} aria-hidden="true">
					{item.iconSrc ? (
						<img className={styles.nodeIconImage} src={item.iconSrc} alt="" loading="lazy" />
					) : item.icon ? (
						<span className={styles.nodeIcon}>{item.icon}</span>
					) : (
						<span className={styles.nodeIconFallback}>{fallback}</span>
					)}
				</span>
				<strong className={styles.nodeTitle}>{item.name}</strong>
			</div>
			{item.reconciliation ? (
				<span className={styles.runtimeBadge}>
					{item.reconciliation.replaceAll("_", " ")}
					{item.runtimeState ? ` · ${item.runtimeState}` : ""}
				</span>
			) : null}
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
		const width = Math.max(1, items.length - 1) * 270;
		items.forEach((entity, index) => {
			positions.set(entity.id, { x: 850 - width / 2 + index * 270, y: layer * 205 });
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
			x: (index % columns) * 300,
			y: Math.floor(index / columns) * 175,
		});
	});
	return positions;
}

function makeNodes(
	entities: ArchitectureEntity[],
	mode: GraphMode,
	openLabel: string,
	statusById: Map<string, HomelabStatusService>,
): Node<ArchitectureNodeData>[] {
	const positions = mode === "ai" ? layerPositions(entities) : gridPositions(entities);
	return entities.map((entity) => {
		const runtimeStatus = mode === "services" ? statusById.get(entity.id) : undefined;
		return {
			id: entity.id,
			type: "architecture",
			position: positions.get(entity.id) ?? { x: 0, y: 0 },
			data: {
				name: entity.name,
				kind: entity.kind,
				category: entity.category,
				url: entity.url,
				detail: entity.detail,
				icon: entity.icon,
				iconSrc: entity.iconSrc,
				openLabel,
				reconciliation: runtimeStatus?.reconciliation,
				runtimeState: runtimeStatus?.observed?.appState,
			},
		};
	});
}

function makeEdges(relations: ArchitectureRelation[], visible: Set<string>): Edge[] {
	return relations
		.filter((relation) => visible.has(relation.source) && visible.has(relation.target))
		.map((relation, index) => {
			const stroke = relation.optional ? "#94a3b8" : "#38bdf8";
			return {
				id: `${relation.source}-${relation.type}-${relation.target}-${index}`,
				source: relation.source,
				target: relation.target,
				label: relation.type,
				animated: !relation.optional,
				markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
				style: { stroke, strokeWidth: relation.optional ? 1.7 : 2.4 },
				labelStyle: { fill: "#f8fafc", fontSize: 11, fontWeight: 700 },
				labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
				labelBgPadding: [5, 3],
				labelBgBorderRadius: 4,
				className: relation.optional ? styles.edgeOptional : styles.edgeRequired,
			};
		});
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

function observedOnlyEntities(snapshot: HomelabStatusSnapshot | null): ArchitectureEntity[] {
	return (snapshot?.observedOnly ?? []).map((service) => ({
		id: service.id,
		name: service.name,
		kind: "TrueNAS app",
		category: "runtime drift",
		icon: "⚠️",
		detail: service.observed?.appState
			? `Observed by TrueNAS · ${service.observed.appState}`
			: "Observed by TrueNAS but not declared in nabla-compose",
	}));
}

function runtimeAvailability(snapshot: HomelabStatusSnapshot | null, french: boolean): string | null {
	if (!snapshot) return null;
	if (!snapshot.runtime.configured) return french ? "non configuré" : "not configured";
	if (snapshot.runtime.stale) return french ? "snapshot périmé" : "stale snapshot";
	if (snapshot.runtime.reachable) return french ? "joignable" : "reachable";
	return french ? "injoignable" : "unreachable";
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
	const [runtimeStatus, setRuntimeStatus] = useState<HomelabStatusSnapshot | null>(null);
	const [runtimeSource, setRuntimeSource] = useState<"loading" | "fastapi" | "unavailable">("loading");

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				const response = await fetch("/api/homelab-status", { cache: "no-store" });
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const snapshot = parseHomelabStatusSnapshot(await response.json());
				if (!snapshot) throw new Error("Invalid homelab status payload");
				if (active) {
					setRuntimeStatus(snapshot);
					setRuntimeSource("fastapi");
				}
			} catch {
				if (active) setRuntimeSource("unavailable");
			}
		};
		void load();
		const timer = window.setInterval(load, 30_000);
		return () => {
			active = false;
			window.clearInterval(timer);
		};
	}, []);

	const statusById = useMemo(
		() =>
			new Map(
				[...(runtimeStatus?.services ?? []), ...(runtimeStatus?.observedOnly ?? [])].map(
					(service) => [service.id, service],
				),
			),
		[runtimeStatus],
	);
	const servicesEntities = useMemo(() => {
		const declared = buildNablaEntities(catalog.services, topology);
		const existingIds = new Set(declared.map((entity) => entity.id));
		return [
			...declared,
			...observedOnlyEntities(runtimeStatus).filter((entity) => !existingIds.has(entity.id)),
		];
	}, [catalog.services, topology, runtimeStatus]);
	const servicesRelations = useMemo(() => buildNablaRelations(topology), [topology]);
	const entities = mode === "ai" ? AI_ENTITIES : servicesEntities;
	const relations = mode === "ai" ? AI_RELATIONS : servicesRelations;
	const filtered = useMemo(() => filterGraph(entities, relations, query), [entities, relations, query]);
	const nodes = useMemo(
		() => makeNodes(filtered.entities, mode, french ? "Ouvrir" : "Open", statusById),
		[filtered.entities, french, mode, statusById],
	);
	const edges = useMemo(
		() => makeEdges(relations, filtered.visible),
		[relations, filtered.visible],
	);
	const availability = runtimeAvailability(runtimeStatus, french);

	return (
		<section
			className={styles.explorer}
			aria-label={french ? "Explorateur d’architecture" : "Architecture explorer"}
		>
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
						{" "}· catalog: {catalogSource} · topology: {topologySource} · runtime: {runtimeSource}
						{availability ? ` (${availability})` : ""}
					</span>
				) : null}
			</div>

			<div className={styles.flowShell}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					colorMode="dark"
					fitView
					fitViewOptions={{ padding: 0.1 }}
					nodesConnectable={false}
					deleteKeyCode={null}
					minZoom={0.16}
					maxZoom={2}
					aria-label={french ? "Topologie interactive des services" : "Interactive service topology"}
				>
					<MiniMap
						pannable
						zoomable
						bgColor="#0f172a"
						maskColor="rgb(2 6 23 / 74%)"
						nodeColor="#38bdf8"
						nodeStrokeColor="#e0f2fe"
						nodeStrokeWidth={2}
						className={styles.miniMap}
					/>
					<Controls className={styles.flowControls} />
					<Background color="#334155" bgColor="#020617" gap={20} size={1.2} />
				</ReactFlow>
			</div>
			<p className={styles.legend}>
				{french
					? "Les flèches cyan animées représentent les relations requises ; les icônes utilisent d’abord les logos du catalogue, puis l’icône déclarée et enfin un fallback lisible. Les badges runtime montrent la réconciliation TrueNAS."
					: "Animated cyan arrows represent required relations; icons use catalog logos first, then declared icons and finally a readable fallback. Runtime badges show TrueNAS reconciliation."}
			</p>
		</section>
	);
}
