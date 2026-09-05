"use client";

import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	type NodeProps,
	type NodeTypes,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import {
	type HomelabHealthEntry,
	type HomelabHealthSnapshot,
	type HomelabHealthState,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import {
	cloudflareIndicatorColor,
	hasCloudflareEvidence,
	homelabHealthColor,
	isHttpsEndpoint,
	tlsIndicatorColor,
} from "@/lib/homelabHealthPresentation";
import {
	blockedDependencyLabels,
	requiredDependencyTargetState,
	resolveEffectiveServiceState,
} from "@/lib/homelabHealthResolver";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	type ServiceCriticality,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import {
	type HomelabStatusService,
	type HomelabStatusSnapshot,
	parseHomelabStatusSnapshot,
} from "@/lib/homelabStatus";
import type {
	ServiceTopology,
	ServiceTopologySource,
} from "@/lib/serviceTopology";
import styles from "./HierarchicalArchitectureExplorer.module.css";
import {
	AI_ENTITIES,
	AI_RELATIONS,
	type ArchitectureEntity,
	type ArchitectureRelation,
	buildNablaEntities,
	buildNablaRelations,
} from "./architectureData";

type GraphMode = "ai" | "services";
type GraphScope = "critical" | "all";
type FlowDirection = "down" | "up";
type ServiceGroupKey =
	| ServiceCriticalityTier
	| "external"
	| "runtime-drift";
type GroupKey = `ai-${number}` | ServiceGroupKey;
type RelationSemantic =
	| "dependency"
	| "flow"
	| "exposure"
	| "placement"
	| "observation"
	| "automation";

type ArchitectureNodeData = Record<string, unknown> & {
	name: string;
	kind: string;
	category: string;
	url?: string;
	detail?: string;
	icon?: string;
	iconSrc?: string;
	openLabel: string;
	flowDirection: FlowDirection;
	reconciliation?: string;
	runtimeState?: string;
	healthState?: HomelabHealthState;
	localHealthState?: HomelabHealthState;
	blockedBy?: string[];
	tlsTrusted?: boolean | null;
	cloudflareObserved?: boolean;
	cloudflareStatus?: string | null;
	cloudflareColor?: string;
	applicationError?: string | null;
	criticalityTier?: ServiceCriticalityTier;
	blastRadius?: number;
	blastRadiusLevel?: "dominant" | "elevated";
};

type GroupNodeData = Record<string, unknown> & {
	label: string;
	description: string;
	groupKey: GroupKey;
	count: number;
	flowHint: string;
};

type Props = {
	locale: string;
	catalog: HomelabServicesCatalog;
	catalogSource: string;
	topology: ServiceTopology;
	topologySource: ServiceTopologySource;
};

type GraphGroup = {
	id: string;
	key: GroupKey;
	label: string;
	description: string;
	flowHint: string;
	entities: ArchitectureEntity[];
	flowDirection: FlowDirection;
};

const NODE_WIDTH = 224;
const NODE_ROW_HEIGHT = 205;
const GROUP_PADDING_X = 34;
const GROUP_HEADER_HEIGHT = 78;
const GROUP_GAP = 36;
const COLUMN_GAP = 30;
const MAX_COLUMNS = 5;
const GROUP_WIDTH =
	GROUP_PADDING_X * 2 + NODE_WIDTH * MAX_COLUMNS + COLUMN_GAP * (MAX_COLUMNS - 1);

const SERVICE_GROUP_ORDER: readonly ServiceGroupKey[] = [
	"foundation",
	"shared-data",
	"shared-platform",
	"application",
	"support",
	"external",
	"runtime-drift",
];

const RELATION_STYLE: Record<
	RelationSemantic,
	{ color: string; dash?: string; animated?: boolean }
> = {
	dependency: { color: "#38bdf8", animated: true },
	flow: { color: "#60a5fa", animated: true },
	exposure: { color: "#c084fc", dash: "11 5" },
	placement: { color: "#94a3b8", dash: "2 5" },
	observation: { color: "#4ade80", dash: "4 6" },
	automation: { color: "#fbbf24", dash: "10 4 2 4", animated: true },
};

const AI_GROUP_COPY: Record<
	number,
	{ en: [string, string]; fr: [string, string] }
> = {
	0: {
		en: ["Interfaces & agents", "Human-facing clients and coding/agent entry points."],
		fr: ["Interfaces & agents", "Clients utilisateurs et points d’entrée des agents/coding agents."],
	},
	1: {
		en: ["Control plane", "Shared model gateway, routing policy and hot state."],
		fr: ["Plan de contrôle", "Gateway de modèles, politiques de routage et état partagé à chaud."],
	},
	2: {
		en: ["Inference", "Local and remote model execution targets."],
		fr: ["Inférence", "Cibles d’exécution locales et distantes des modèles."],
	},
	3: {
		en: ["Tools & knowledge", "MCP tools, search, RAG and document knowledge boundaries."],
		fr: ["Outils & connaissances", "Outils MCP, recherche, RAG et sources documentaires."],
	},
	4: {
		en: ["Orchestration", "Workflow engines coordinating long-running and automated work."],
		fr: ["Orchestration", "Moteurs de workflow coordonnant automatisations et traitements longs."],
	},
	5: {
		en: ["Observability & evaluation", "Tracing, metrics, quality and evaluation feedback loops."],
		fr: ["Observabilité & évaluation", "Tracing, métriques, qualité et boucles d’évaluation."],
	},
};

function relationSemantic(type: string): RelationSemantic {
	if (["dependsOn", "storesIn", "authenticatesVia", "cache"].includes(type)) {
		return "dependency";
	}
	if (["exposedBy"].includes(type)) return "exposure";
	if (["partOf", "hostedBy"].includes(type)) return "placement";
	if (["observedBy", "telemetry", "metrics", "traces", "evaluation"].includes(type)) {
		return "observation";
	}
	if (["automates", "document workflow"].includes(type)) return "automation";
	return "flow";
}

function relationSemanticLabel(semantic: RelationSemantic, french: boolean): string {
	const labels: Record<RelationSemantic, [string, string]> = {
		dependency: ["dependency", "dépendance"],
		flow: ["API/data flow", "flux API/données"],
		exposure: ["exposure", "exposition"],
		placement: ["placement", "hébergement"],
		observation: ["observation", "observabilité"],
		automation: ["automation", "automatisation"],
	};
	return labels[semantic][french ? 1 : 0];
}

function relationSemanticClass(semantic: RelationSemantic): string {
	switch (semantic) {
		case "dependency":
			return styles.edgeDependency;
		case "flow":
			return styles.edgeFlow;
		case "exposure":
			return styles.edgeExposure;
		case "placement":
			return styles.edgePlacement;
		case "observation":
			return styles.edgeObservation;
		case "automation":
			return styles.edgeAutomation;
	}
}

function relationStrengthLabel(optional: boolean, french: boolean): string {
	if (french) return optional ? "optionnelle" : "requise";
	return optional ? "optional" : "required";
}

function serviceGroupCopy(
	key: ServiceGroupKey,
	french: boolean,
): [string, string] {
	const en: Record<ServiceGroupKey, [string, string]> = {
		foundation: [
			"1 · Infrastructure foundations",
			"Storage, runtime, firewall and edge components with the broadest failure domain.",
		],
		"shared-data": [
			"2 · Shared data & state",
			"Databases, caches and durable state used by dependent services.",
		],
		"shared-platform": [
			"3 · Shared platform services",
			"Gateways, runtimes and shared capabilities reused by several consumers.",
		],
		application: [
			"4 · Applications & consumers",
			"User-facing workloads and consumers that depend on the shared layers above.",
		],
		support: [
			"5 · Support / low blast radius",
			"Leaf, observability and support components with no required downstream consumers.",
		],
		external: [
			"External platforms",
			"Collaboration and SaaS/platform entities outside the declared homelab dependency graph.",
		],
		"runtime-drift": [
			"Observed runtime drift",
			"Workloads observed on TrueNAS but not declared in the current topology.",
		],
	};
	const fr: Record<ServiceGroupKey, [string, string]> = {
		foundation: [
			"1 · Fondations d’infrastructure",
			"Stockage, runtime, firewall et edge avec le plus grand domaine de panne.",
		],
		"shared-data": [
			"2 · Données & état partagés",
			"Bases, caches et état durable consommés par les services dépendants.",
		],
		"shared-platform": [
			"3 · Services de plateforme partagés",
			"Gateways, runtimes et capacités mutualisées par plusieurs consommateurs.",
		],
		application: [
			"4 · Applications & consommateurs",
			"Workloads utilisateurs dépendant des couches partagées situées au-dessus.",
		],
		support: [
			"5 · Support / faible rayon d’impact",
			"Composants feuilles, observabilité et support sans consommateurs requis en aval.",
		],
		external: [
			"Plateformes externes",
			"Collaboration et SaaS hors du graphe de dépendances homelab déclaré.",
		],
		"runtime-drift": [
			"Dérive runtime observée",
			"Workloads vus par TrueNAS mais absents de la topologie déclarée.",
		],
	};
	return (french ? fr : en)[key];
}

function ArchitectureGroupNode({ data }: NodeProps) {
	const item = data as GroupNodeData;
	return (
		<div
			className={styles.groupNode}
			data-architecture-group={item.groupKey}
		>
			<div className={styles.groupHeading}>
				<div>
					<strong>{item.label}</strong>
					<span>{item.description}</span>
				</div>
				<div className={styles.groupMeta}>
					<span>{item.count} nodes</span>
					<span>{item.flowHint}</span>
				</div>
			</div>
		</div>
	);
}

function ArchitectureNode({ data, selected }: NodeProps) {
	const item = data as ArchitectureNodeData;
	const fallback = item.name.trim().slice(0, 2).toUpperCase();
	const healthColor = item.healthState
		? homelabHealthColor(item.healthState)
		: undefined;
	const https = isHttpsEndpoint(item.url);
	const targetPosition =
		item.flowDirection === "up" ? Position.Bottom : Position.Top;
	const sourcePosition =
		item.flowDirection === "up" ? Position.Top : Position.Bottom;
	const healthLabel = item.healthState
		? `Health: ${item.healthState}${item.localHealthState && item.localHealthState !== item.healthState ? ` (local ${item.localHealthState})` : ""}`
		: "Health unavailable";
	const dependencyDegraded =
		(item.blockedBy?.length ?? 0) > 0 ||
		Boolean(
			item.localHealthState &&
				item.healthState &&
				item.localHealthState !== item.healthState,
		);

	return (
		<div
			className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}
			data-reconciliation={item.reconciliation}
			data-health-state={item.healthState}
			data-criticality-tier={item.criticalityTier}
			data-blast-radius-level={item.blastRadiusLevel}
			style={
				healthColor
					? {
							borderColor: healthColor,
							boxShadow: `0 0 0 1px ${healthColor}55`,
						}
					: undefined
			}
		>
			<Handle type="target" position={targetPosition} className={styles.handle} />
			<div className={styles.nodeMeta}>
				<span>{item.category}</span>
				<span style={healthColor ? { color: healthColor } : undefined}>
					{item.healthState ?? item.kind}
				</span>
			</div>
			<div className={styles.nodeHeading}>
				<span className={styles.nodeIconFrame} aria-hidden="true">
					{item.iconSrc ? (
						<img
							className={styles.nodeIconImage}
							src={item.iconSrc}
							alt=""
							loading="lazy"
						/>
					) : item.icon ? (
						<span className={styles.nodeIcon}>{item.icon}</span>
					) : (
						<span className={styles.nodeIconFallback}>{fallback}</span>
					)}
				</span>
				<strong
					className={styles.nodeTitle}
					style={healthColor ? { color: healthColor } : undefined}
				>
					{item.name}
				</strong>
				{https ? (
					<i
						className="fas fa-lock"
						style={{ color: tlsIndicatorColor(item.tlsTrusted), marginLeft: 6 }}
						title={
							item.tlsTrusted === true
								? "TLS trusted"
								: item.tlsTrusted === false
									? "TLS invalid"
									: "TLS not verified"
						}
						aria-label="TLS status"
					/>
				) : null}
				{item.cloudflareObserved ? (
					<i
						className="fas fa-cloud"
						style={{ color: item.cloudflareColor, marginLeft: 6 }}
						title={`Cloudflare${item.cloudflareStatus ? `: ${item.cloudflareStatus}` : " observed"}`}
						aria-label="Cloudflare evidence"
					/>
				) : null}
				{item.applicationError ? (
					<i
						className="fas fa-skull-crossbones"
						style={{ color: homelabHealthColor("fail"), marginLeft: 6 }}
						title={item.applicationError}
						aria-label={item.applicationError}
					/>
				) : null}
			</div>
			{item.criticalityTier ? (
				<span className={styles.criticalityBadge}>
					{item.criticalityTier.replaceAll("-", " ")}
					{typeof item.blastRadius === "number"
						? ` · blast radius ${item.blastRadius}`
						: ""}
				</span>
			) : null}
			{item.reconciliation ? (
				<span className={styles.runtimeBadge}>
					{item.reconciliation.replaceAll("_", " ")}
					{item.runtimeState ? ` · ${item.runtimeState}` : ""}
				</span>
			) : null}
			{dependencyDegraded ? (
				<span
					className={styles.runtimeBadge}
					data-dependency-health
					title={healthLabel}
				>
					⚠ dependency
					{item.blockedBy?.length ? ` · ${item.blockedBy.join(", ")}` : ""}
				</span>
			) : null}
			{item.detail ? (
				<small className={styles.nodeDetail}>{item.detail}</small>
			) : null}
			{item.url ? (
				<a
					className={`${styles.openLink} nodrag nopan`}
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(event) => event.stopPropagation()}
					style={
						healthColor
							? { color: healthColor, borderColor: healthColor }
							: undefined
					}
					title={healthLabel}
				>
					{item.openLabel} ↗
				</a>
			) : null}
			<Handle type="source" position={sourcePosition} className={styles.handle} />
		</div>
	);
}


function MobileArchitectureHierarchy({
	groups,
	nodeDataById,
	relations,
	french,
}: Readonly<{
	groups: GraphGroup[];
	nodeDataById: Map<string, ArchitectureNodeData>;
	relations: Edge[];
	french: boolean;
}>) {
	const relationsBySource = new Map<string, Edge[]>();
	for (const relation of relations) {
		relationsBySource.set(relation.source, [
			...(relationsBySource.get(relation.source) ?? []),
			relation,
		]);
	}

	return (
		<div
			className={styles.mobileHierarchy}
			data-mobile-architecture-hierarchy
			role="region"
			aria-label={
				french
					? "Hiérarchie d’architecture compacte"
					: "Compact architecture hierarchy"
			}
		>
			<p className={styles.mobileHierarchyHint}>
				{french
					? "Vue mobile compacte : ouvrez une couche puis un service pour afficher ses relations visibles."
					: "Compact mobile view: expand a layer, then a service, to inspect its visible relations."}
			</p>
			{groups.map((group) => (
				<details
					key={group.id}
					className={styles.mobileGroup}
					data-mobile-architecture-group={group.key}
				>
					<summary className={styles.mobileGroupSummary}>
						<span>
							<strong>{group.label}</strong>
							<small>{group.description}</small>
						</span>
						<span className={styles.mobileGroupMeta}>
							{group.entities.length} {french ? "nœuds" : "nodes"} · {group.flowHint}
						</span>
					</summary>
					<ul className={styles.mobileItemList}>
						{group.entities.map((entity) => {
							const item = nodeDataById.get(entity.id);
							if (!item) return null;
							const itemRelations = relationsBySource.get(entity.id) ?? [];
							const healthColor = item.healthState
								? homelabHealthColor(item.healthState)
								: undefined;

							return (
								<li
									key={entity.id}
									className={styles.mobileItem}
									data-mobile-architecture-item={entity.id}
									data-health-state={item.healthState}
									data-criticality-tier={item.criticalityTier}
									data-blast-radius-level={item.blastRadiusLevel}
								>
									<div className={styles.mobileItemHeading}>
										<span>
											<strong>{item.name}</strong>
											<small>
												{item.category} · {item.kind}
											</small>
										</span>
										{item.healthState ? (
											<span
												className={styles.mobileHealthBadge}
												style={{
													borderColor: healthColor,
													color: healthColor,
												}}
											>
												{item.healthState}
											</span>
										) : null}
									</div>
									<div className={styles.mobileBadges}>
										{item.criticalityTier ? (
											<span>
												{item.criticalityTier.replaceAll("-", " ")}
												{typeof item.blastRadius === "number"
													? ` · blast radius ${item.blastRadius}`
													: ""}
											</span>
										) : null}
										{item.reconciliation ? (
											<span>
												{item.reconciliation.replaceAll("_", " ")}
												{item.runtimeState ? ` · ${item.runtimeState}` : ""}
											</span>
										) : null}
										{item.localHealthState &&
										item.healthState &&
										item.localHealthState !== item.healthState ? (
											<span>
												local · {item.localHealthState}
											</span>
										) : null}
									</div>
									{item.blockedBy?.length ? (
										<p className={styles.mobileBlockedBy}>
											⚠ {french ? "Bloqué par" : "Blocked by"}:{" "}
											{item.blockedBy.join(", ")}
										</p>
									) : null}
									{item.detail ? (
										<p className={styles.mobileItemDetail}>{item.detail}</p>
									) : null}
									{itemRelations.length ? (
										<details className={styles.mobileRelations}>
											<summary>
												{itemRelations.length}{" "}
												{french
													? itemRelations.length > 1
														? "relations"
														: "relation"
													: itemRelations.length > 1
														? "relations"
														: "relation"}
											</summary>
											<ul>
												{itemRelations.map((relation) => {
													const targetName =
														nodeDataById.get(relation.target)?.name ??
														relation.target;
													return (
														<li key={relation.id}>
															<span>{String(relation.label ?? relation.target)}</span>
															<strong>{targetName}</strong>
														</li>
													);
												})}
											</ul>
										</details>
									) : null}
									{item.url ? (
										<a
											className={styles.mobileOpenLink}
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
										>
											{item.openLabel} ↗
										</a>
									) : null}
								</li>
							);
						})}
					</ul>
				</details>
			))}
		</div>
	);
}

const NODE_TYPES: NodeTypes = {
	architecture: ArchitectureNode,
	architectureGroup: ArchitectureGroupNode,
};

function healthMap(
	snapshot: HomelabHealthSnapshot | null,
): Map<string, HomelabHealthEntry> {
	return new Map(
		(snapshot?.services ?? [])
			.filter((entry): entry is HomelabHealthEntry & { id: string } =>
				Boolean(entry.id),
			)
			.map((entry) => [entry.id, entry]),
	);
}

function observedOnlyEntities(
	snapshot: HomelabStatusSnapshot | null,
): ArchitectureEntity[] {
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

function runtimeAvailability(
	snapshot: HomelabStatusSnapshot | null,
	french: boolean,
): string | null {
	if (!snapshot) return null;
	if (!snapshot.runtime.configured)
		return french ? "non configuré" : "not configured";
	if (snapshot.runtime.stale)
		return french ? "snapshot périmé" : "stale snapshot";
	if (snapshot.runtime.reachable) return french ? "joignable" : "reachable";
	return french ? "injoignable" : "unreachable";
}

function filterGraph(
	entities: ArchitectureEntity[],
	relations: ArchitectureRelation[],
	query: string,
): { entities: ArchitectureEntity[]; visible: Set<string> } {
	const needle = query.trim().toLowerCase();
	if (!needle) {
		return { entities, visible: new Set(entities.map((entity) => entity.id)) };
	}
	const matches = new Set(
		entities
			.filter((entity) =>
				`${entity.name} ${entity.kind} ${entity.category}`
					.toLowerCase()
					.includes(needle),
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

function aiGroups(
	entities: ArchitectureEntity[],
	french: boolean,
): GraphGroup[] {
	const byLayer = new Map<number, ArchitectureEntity[]>();
	for (const entity of entities) {
		const layer = entity.layer ?? 99;
		byLayer.set(layer, [...(byLayer.get(layer) ?? []), entity]);
	}
	return [...byLayer.entries()]
		.sort(([left], [right]) => left - right)
		.map(([layer, layerEntities]) => {
			const copy = AI_GROUP_COPY[layer] ?? {
				en: [`Layer ${layer}`, "Architecture layer"],
				fr: [`Couche ${layer}`, "Couche d’architecture"],
			};
			const [label, description] = french ? copy.fr : copy.en;
			return {
				id: `architecture-group-ai-${layer}`,
				key: `ai-${layer}` as GroupKey,
				label,
				description,
				flowHint: french ? "flux principal ↓" : "main flow ↓",
				entities: [...layerEntities].sort((a, b) => a.name.localeCompare(b.name)),
				flowDirection: "down" as const,
			};
		});
}

function serviceGroupKey(
	entity: ArchitectureEntity,
	analysis: Map<string, ServiceCriticality>,
	topologyIds: Set<string>,
): ServiceGroupKey {
	if (entity.category === "runtime drift") return "runtime-drift";
	const tier = analysis.get(entity.id)?.tier;
	if (tier) return tier;
	return topologyIds.has(entity.id) ? "support" : "external";
}

function serviceGroups(
	entities: ArchitectureEntity[],
	topology: ServiceTopology,
	french: boolean,
): GraphGroup[] {
	const analysis = analyzeServiceCriticality(topology);
	const topologyIds = new Set<string>(topology.nodes.map((node) => node.id));
	const grouped = new Map<ServiceGroupKey, ArchitectureEntity[]>();
	for (const entity of entities) {
		const key = serviceGroupKey(entity, analysis, topologyIds);
		grouped.set(key, [...(grouped.get(key) ?? []), entity]);
	}
	return SERVICE_GROUP_ORDER.filter((key) => grouped.has(key)).map((key) => {
		const groupEntities = [...(grouped.get(key) ?? [])].sort((left, right) => {
			if (analysis.has(left.id) || analysis.has(right.id)) {
				return compareServiceCriticality(left.id, right.id, topology, analysis);
			}
			return left.category.localeCompare(right.category) || left.name.localeCompare(right.name);
		});
		const [label, description] = serviceGroupCopy(key, french);
		return {
			id: `architecture-group-${key}`,
			key,
			label,
			description,
			flowHint:
				key === "external" || key === "runtime-drift"
					? french
						? "contexte"
						: "context"
					: french
						? "dépendances requises ↑"
						: "required dependencies ↑",
			entities: groupEntities,
			flowDirection: "up" as const,
		};
	});
}

function buildGroupedNodes(
	groups: GraphGroup[],
	mode: GraphMode,
	openLabel: string,
	statusById: Map<string, HomelabStatusService>,
	healthById: Map<string, HomelabHealthEntry>,
	criticality: Map<string, ServiceCriticality>,
): Node[] {
	const nodes: Node[] = [];
	const maxBlastRadius = Math.max(
		0,
		...[...criticality.values()].map((entry) => entry.transitiveDependents),
	);
	let y = 0;

	for (const group of groups) {
		const rows = Math.ceil(group.entities.length / MAX_COLUMNS);
		const groupHeight = GROUP_HEADER_HEIGHT + GROUP_PADDING_X + rows * NODE_ROW_HEIGHT;
		nodes.push({
			id: group.id,
			type: "architectureGroup",
			position: { x: 0, y },
			data: {
				label: group.label,
				description: group.description,
				groupKey: group.key,
				count: group.entities.length,
				flowHint: group.flowHint,
			} satisfies GroupNodeData,
			style: { width: GROUP_WIDTH, height: groupHeight },
			selectable: false,
			draggable: false,
			zIndex: -1,
		});

		group.entities.forEach((entity, index) => {
			const col = index % MAX_COLUMNS;
			const row = Math.floor(index / MAX_COLUMNS);
			const runtimeStatus =
				mode === "services" ? statusById.get(entity.id) : undefined;
			const health = mode === "services" ? healthById.get(entity.id) : undefined;
			const resolvedHealth = resolveEffectiveServiceState(health);
			const blockers = blockedDependencyLabels(health);
			const serviceCriticality = criticality.get(entity.id);
			const blastRatio =
				maxBlastRadius > 0 && serviceCriticality
					? serviceCriticality.transitiveDependents / maxBlastRadius
					: 0;
			const blastRadiusLevel =
				blastRatio >= 0.5
					? "dominant"
					: blastRatio >= 0.05
						? "elevated"
						: undefined;

			nodes.push({
				id: entity.id,
				type: "architecture",
				parentId: group.id,
				extent: "parent",
				position: {
					x: GROUP_PADDING_X + col * (NODE_WIDTH + COLUMN_GAP),
					y: GROUP_HEADER_HEIGHT + 12 + row * NODE_ROW_HEIGHT,
				},
				data: {
					name: entity.name,
					kind: entity.kind,
					category: entity.category,
					url: health?.url ?? entity.url,
					detail: entity.detail,
					icon: entity.icon,
					iconSrc: entity.iconSrc,
					openLabel,
					flowDirection: group.flowDirection,
					reconciliation: runtimeStatus?.reconciliation,
					runtimeState: runtimeStatus?.observed?.appState,
					healthState: health?.application_error
						? "fail"
						: health
							? resolvedHealth.effectiveState
							: undefined,
					localHealthState: health ? resolvedHealth.localState : undefined,
					blockedBy: blockers,
					tlsTrusted: health?.tls_trusted,
					cloudflareObserved: hasCloudflareEvidence(health),
					cloudflareStatus: health?.tunnel_status,
					cloudflareColor: cloudflareIndicatorColor(health),
					applicationError: health?.application_error,
					criticalityTier: serviceCriticality?.tier,
					blastRadius: serviceCriticality?.transitiveDependents,
					blastRadiusLevel,
				} satisfies ArchitectureNodeData,
			});
		});
		y += groupHeight + GROUP_GAP;
	}

	return nodes;
}

function requiredEdgeHealthState(
	relation: ArchitectureRelation,
	healthById: Map<string, HomelabHealthEntry>,
): HomelabHealthState | null {
	if (relation.optional || ["partOf", "hostedBy"].includes(relation.type)) return null;
	const sourceHealth = healthById.get(relation.source);
	const evidenceState = requiredDependencyTargetState(
		sourceHealth,
		relation.target,
		relation.type,
	);
	if (evidenceState) return evidenceState;
	const targetHealth = healthById.get(relation.target);
	return targetHealth ? resolveEffectiveServiceState(targetHealth).effectiveState : null;
}

function makeEdges(
	relations: ArchitectureRelation[],
	visible: Set<string>,
	healthById: Map<string, HomelabHealthEntry>,
	showOptional: boolean,
	french: boolean,
): Edge[] {
	return relations
		.filter(
			(relation) =>
				visible.has(relation.source) &&
				visible.has(relation.target) &&
				(showOptional || !relation.optional),
		)
		.map((relation, index) => {
			const targetState = requiredEdgeHealthState(relation, healthById);
			const semantic = relationSemantic(relation.type);
			const semanticStyle = RELATION_STYLE[semantic];
			const stroke =
				targetState === "fail"
					? homelabHealthColor("fail")
					: targetState === "warn" || targetState === "unknown"
						? homelabHealthColor("warn")
						: semanticStyle.color;
			const strokeDasharray = relation.optional
				? semanticStyle.dash ?? "7 6"
				: semanticStyle.dash;
			return {
				id: `${relation.source}-${relation.type}-${relation.target}-${index}`,
				source: relation.source,
				target: relation.target,
				label: `${relationStrengthLabel(Boolean(relation.optional), french)} · ${relationSemanticLabel(semantic, french)} · ${relation.type}`,
				animated: Boolean(!relation.optional && semanticStyle.animated),
				markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
				style: {
					stroke,
					strokeWidth: relation.optional ? 1.5 : 2.4,
					strokeDasharray,
				},
				labelStyle: { fill: "#f8fafc", fontSize: 10, fontWeight: 700 },
				labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
				labelBgPadding: [5, 3],
				labelBgBorderRadius: 4,
				className: `${relation.optional ? styles.edgeOptional : styles.edgeRequired} ${relationSemanticClass(semantic)}`,
				data: {
					semantic,
					strength: relation.optional ? "optional" : "required",
				},
			};
		});
}

export default function HierarchicalArchitectureExplorer({
	locale,
	catalog,
	catalogSource,
	topology,
	topologySource,
}: Readonly<Props>) {
	const french = locale === "fr";
	const [mode, setMode] = useState<GraphMode>("ai");
	const [scope, setScope] = useState<GraphScope>("critical");
	const [showOptional, setShowOptional] = useState(true);
	const [query, setQuery] = useState("");
	const [runtimeStatus, setRuntimeStatus] =
		useState<HomelabStatusSnapshot | null>(null);
	const [healthStatus, setHealthStatus] =
		useState<HomelabHealthSnapshot | null>(null);
	const [runtimeSource, setRuntimeSource] = useState<
		"loading" | "fastapi" | "unavailable"
	>("loading");
	const [healthSource, setHealthSource] = useState<
		"loading" | "fastapi" | "unavailable"
	>("loading");

	useEffect(() => {
		let active = true;
		const loadRuntime = async () => {
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
		const loadHealth = async () => {
			try {
				const response = await fetch("/api/homelab-health", {
					cache: "no-store",
					headers: { Accept: "application/json" },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const snapshot = parseHomelabHealthSnapshot(await response.json());
				if (!snapshot) throw new Error("Invalid homelab health payload");
				if (active) {
					setHealthStatus(snapshot);
					setHealthSource("fastapi");
				}
			} catch {
				if (active) setHealthSource("unavailable");
			}
		};
		const load = () => void Promise.all([loadRuntime(), loadHealth()]);
		load();
		const timer = window.setInterval(load, 30_000);
		return () => {
			active = false;
			window.clearInterval(timer);
		};
	}, []);

	const statusById = useMemo(
		() =>
			new Map(
				[
					...(runtimeStatus?.services ?? []),
					...(runtimeStatus?.observedOnly ?? []),
				].map((service) => [service.id, service]),
			),
		[runtimeStatus],
	);
	const healthById = useMemo(() => healthMap(healthStatus), [healthStatus]);
	const criticality = useMemo(() => analyzeServiceCriticality(topology), [topology]);
	const servicesEntities = useMemo(() => {
		const declared = buildNablaEntities(catalog.services, topology);
		const existingIds = new Set(declared.map((entity) => entity.id));
		return [
			...declared,
			...observedOnlyEntities(runtimeStatus).filter(
				(entity) => !existingIds.has(entity.id),
			),
		];
	}, [catalog.services, topology, runtimeStatus]);
	const servicesRelations = useMemo(() => buildNablaRelations(topology), [topology]);
	const allEntities = mode === "ai" ? AI_ENTITIES : servicesEntities;
	const relations = mode === "ai" ? AI_RELATIONS : servicesRelations;
	const topologyIds = useMemo(
		() => new Set(topology.nodes.map((node) => node.id)),
		[topology],
	);
	const scopedEntities = useMemo(() => {
		if (mode !== "services" || scope === "all" || query.trim()) return allEntities;
		return allEntities.filter((entity) => {
			if (!topologyIds.has(entity.id)) return false;
			const entry = criticality.get(entity.id);
			return Boolean(entry && entry.tier !== "support");
		});
	}, [allEntities, criticality, mode, query, scope, topologyIds]);
	const filtered = useMemo(
		() => filterGraph(scopedEntities, relations, query),
		[scopedEntities, relations, query],
	);
	const groups = useMemo(
		() =>
			mode === "ai"
				? aiGroups(filtered.entities, french)
				: serviceGroups(filtered.entities, topology, french),
		[filtered.entities, french, mode, topology],
	);
	const nodes = useMemo(
		() =>
			buildGroupedNodes(
				groups,
				mode,
				french ? "Ouvrir" : "Open",
				statusById,
				healthById,
				criticality,
			),
		[criticality, french, groups, healthById, mode, statusById],
	);
	const edges = useMemo(
		() => makeEdges(relations, filtered.visible, healthById, showOptional, french),
		[filtered.visible, french, healthById, relations, showOptional],
	);
	const nodeDataById = useMemo(
		() =>
			new Map(
				nodes
					.filter((node) => node.type === "architecture")
					.map((node) => [node.id, node.data as ArchitectureNodeData]),
			),
		[nodes],
	);
	const availability = runtimeAvailability(runtimeStatus, french);

	return (
		<section
			className={styles.explorer}
			aria-label={
				french ? "Explorateur d’architecture hiérarchique" : "Hierarchical architecture explorer"
			}
			data-hierarchical-architecture-explorer
		>
			<div className={styles.toolbar}>
				<div className={styles.controlCluster}>
					<div className={styles.tabs} role="group" aria-label="Diagram view">
						<button
							type="button"
							aria-pressed={mode === "ai"}
							onClick={() => setMode("ai")}
						>
							AI Platform
						</button>
						<button
							type="button"
							aria-pressed={mode === "services"}
							onClick={() => setMode("services")}
						>
							Nabla / TrueNAS
						</button>
					</div>
					{mode === "services" ? (
						<div className={styles.tabs} role="group" aria-label="Topology scope">
							<button
								type="button"
								aria-pressed={scope === "critical"}
								onClick={() => setScope("critical")}
							>
								{french ? "Chemin critique" : "Critical path"}
							</button>
							<button
								type="button"
								aria-pressed={scope === "all"}
								onClick={() => setScope("all")}
							>
								{french ? "Tous les composants" : "All components"}
							</button>
						</div>
					) : null}
					<label className={styles.toggle}>
						<input
							type="checkbox"
							checked={showOptional}
							onChange={(event) => setShowOptional(event.target.checked)}
						/>
						<span>{french ? "Relations optionnelles" : "Optional relations"}</span>
					</label>
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

			<div className={styles.relationLegend} data-architecture-relation-legend>
				<strong>{french ? "Sémantique des arêtes" : "Edge semantics"}</strong>
				<div className={styles.relationLegendItems}>
					{(
						[
							["dependency", french ? "Dépendance" : "Dependency"],
							["flow", french ? "Flux API / données" : "API / data flow"],
							["exposure", french ? "Exposition" : "Exposure"],
							["placement", french ? "Hébergement" : "Placement"],
							["observation", french ? "Observabilité" : "Observation"],
							["automation", french ? "Automatisation" : "Automation"],
						] as const
					).map(([semantic, label]) => (
						<span key={semantic} data-relation-kind={semantic}>
							<i
								className={`${styles.relationSwatch} ${relationSemanticClass(semantic)}`}
								aria-hidden="true"
							/>
							{label}
						</span>
					))}
				</div>
				<small>
					{french
						? "La couleur et le motif indiquent la nature de la relation ; required/optional indique séparément son poids fonctionnel. Un état de santé rouge/orange peut temporairement remplacer la couleur d’une relation requise sans changer sa sémantique."
						: "Color and line pattern identify relation purpose; required/optional separately identifies functional strength. A required edge may temporarily inherit red/orange health without changing its semantic category."}
				</small>
			</div>

			{mode === "services" ? (
				<aside className={styles.exposureContract} data-exposure-path-contract>
					<div className={styles.exposureContractHeader}>
						<strong>{french ? "Contrat des chemins d’exposition" : "Exposure path contract"}</strong>
						<span>{french ? "Réseau ≠ dépendances fonctionnelles" : "Network ≠ functional dependencies"}</span>
					</div>
					<div className={styles.exposurePathGrid}>
						<div data-exposure-path="direct">
							<strong>HAProxy direct</strong>
							<code>Internet → pfSense:7000 → HAProxy → TrueNAS:7000</code>
							<small>
								{french
									? "Chemin public direct explicitement distinct du Tunnel Cloudflare."
									: "Public direct path explicitly separate from Cloudflare Tunnel."}
							</small>
						</div>
						<div data-exposure-path="cloudflare">
							<strong>Cloudflare Tunnel</strong>
							<code>Cloudflare edge → cloudflared → service</code>
							<small data-cloudflare-direct-isolation>
								{french
									? "Une preuve Tunnel/Access ne prouve jamais que le chemin direct pfSense:7000 → HAProxy → TrueNAS fonctionne."
									: "Tunnel/Access evidence never proves that the direct pfSense:7000 → HAProxy → TrueNAS path works."}
							</small>
						</div>
						<div data-exposure-path="lan-vpn">
							<strong>LAN / VPN only</strong>
							<code>pfSense admin 10443/tcp · TrueNAS SSH 9922/tcp</code>
							<small>
								{french
									? "Ces ports d’administration ne sont pas des endpoints Internet attendus."
									: "These administration ports are not expected Internet endpoints."}
							</small>
						</div>
						<div data-exposure-path="internal">
							<strong>{french ? "Routage interne" : "Internal routing"}</strong>
							<code>service → API / data / dependency → service</code>
							<small>
								{french
									? "Une relation fonctionnelle interne ne signifie pas qu’un service est publiquement exposé."
									: "An internal functional relationship does not mean a service is publicly exposed."}
							</small>
						</div>
					</div>
				</aside>
			) : null}


			<MobileArchitectureHierarchy
				groups={groups}
				nodeDataById={nodeDataById}
				relations={edges}
				french={french}
			/>

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
					minZoom={0.1}
					maxZoom={1.8}
					proOptions={{ hideAttribution: true }}
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
						? "Les swimlanes reprennent exactement les niveaux de criticité de la section Critical dependency hierarchy. Les fondations sont en haut ; les flèches requises remontent depuis les consommateurs vers leurs cibles. La couleur et le motif distinguent désormais dépendance, flux API/données, exposition, hébergement, observabilité et automatisation. Le mode Chemin critique masque les composants support et externes pour réduire le bruit ; la recherche réactive automatiquement l’ensemble du catalogue."
						: "Swimlanes reuse the exact criticality tiers from Critical dependency hierarchy. Foundations sit at the top; required arrows point upward from consumers to their targets. Color and line pattern now distinguish dependency, API/data flow, exposure, placement, observation, and automation. Critical path hides support and external components to reduce noise; searching automatically considers the full catalog."
					: french
						? "AI Platform est regroupé par couches fonctionnelles. Le flux principal descend des interfaces vers le control plane, l’inférence, les outils, l’orchestration et l’observabilité ; la sémantique des arêtes reste distincte de leur caractère requis ou optionnel."
						: "AI Platform is grouped by functional layers. The main flow moves from interfaces through control plane, inference, tools, orchestration and observability; edge semantics remain distinct from required/optional strength."}
			</p>
		</section>
	);
}
