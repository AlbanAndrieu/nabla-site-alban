import { type Edge, MarkerType, type Node } from "@xyflow/react";
import type { HomelabHealthEntry } from "@/lib/homelabHealth";
import {
	cloudflareIndicatorColor,
	hasCloudflareEvidence,
	homelabHealthColor,
} from "@/lib/homelabHealthPresentation";
import {
	blockedDependencyLabels,
	type DependencyRelationHealth,
	degradedDependencyLabels,
	requiredDependencyRelationHealth,
	resolveEffectiveServiceState,
	unconfirmedDependencyLabels,
} from "@/lib/homelabHealthResolver";
import type { HomelabStatusService } from "@/lib/homelabStatus";
import type { ServiceCriticality } from "@/lib/serviceCriticality";
import type { ArchitectureRelation } from "./architectureData";
import styles from "./HierarchicalArchitectureExplorer.module.css";
import {
	type ArchitectureNodeData,
	COLUMN_GAP,
	GROUP_GAP,
	GROUP_HEADER_HEIGHT,
	GROUP_PADDING_X,
	GROUP_WIDTH,
	type GraphGroup,
	type GraphMode,
	type GroupNodeData,
	MAX_COLUMNS,
	NODE_ROW_HEIGHT,
	NODE_WIDTH,
	RELATION_STYLE,
	relationSemantic,
	relationSemanticClass,
	relationSemanticLabel,
	relationStrengthLabel,
} from "./hierarchicalArchitectureModel";

export function buildGroupedNodes(
	groups: GraphGroup[],
	mode: GraphMode,
	openLabel: string,
	statusById: Map<string, HomelabStatusService>,
	healthById: Map<string, HomelabHealthEntry>,
	criticality: Map<string, ServiceCriticality>,
	french: boolean,
): Node[] {
	const nodes: Node[] = [];
	const maxBlastRadius = Math.max(
		0,
		...[...criticality.values()].map((entry) => entry.transitiveDependents),
	);
	let y = 0;

	for (const group of groups) {
		const rows = Math.ceil(group.entities.length / MAX_COLUMNS);
		const groupHeight =
			GROUP_HEADER_HEIGHT + GROUP_PADDING_X + rows * NODE_ROW_HEIGHT;
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
			const health =
				mode === "services" ? healthById.get(entity.id) : undefined;
			const resolvedHealth = resolveEffectiveServiceState(health);
			const blockers = blockedDependencyLabels(health);
			const degraded = degradedDependencyLabels(health);
			const unconfirmed = unconfirmedDependencyLabels(health);
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
					french,
					reconciliation: runtimeStatus?.reconciliation,
					runtimeState: runtimeStatus?.observed?.appState,
					healthState: health?.application_error
						? "fail"
						: health
							? resolvedHealth.effectiveState
							: undefined,
					localHealthState: health ? resolvedHealth.localState : undefined,
					blockedBy: blockers,
					degradedBy: degraded,
					unconfirmedDependencies: unconfirmed,
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

function requiredEdgeDependencyState(
	relation: ArchitectureRelation,
	healthById: Map<string, HomelabHealthEntry>,
): DependencyRelationHealth | null {
	if (relation.optional || ["partOf", "hostedBy"].includes(relation.type))
		return null;
	return requiredDependencyRelationHealth(
		healthById.get(relation.source),
		relation.target,
		relation.type,
	);
}

export function makeEdges(
	relations: ArchitectureRelation[],
	visible: Set<string>,
	healthById: Map<string, HomelabHealthEntry>,
	showOptional: boolean,
	french: boolean,
	mode: GraphMode,
): Edge[] {
	return relations
		.filter(
			(relation) =>
				visible.has(relation.source) &&
				visible.has(relation.target) &&
				(showOptional || !relation.optional),
		)
		.map((relation, index) => {
			const semantic = relationSemantic(relation.type);
			const dependencyState =
				mode === "services" && semantic === "dependency"
					? requiredEdgeDependencyState(relation, healthById)
					: null;
			const semanticStyle = RELATION_STYLE[semantic];
			const stroke =
				dependencyState === "blocked"
					? homelabHealthColor("fail")
					: dependencyState === "degraded"
						? homelabHealthColor("warn")
						: dependencyState === "unconfirmed"
							? homelabHealthColor("unknown")
							: semanticStyle.color;
			const strokeDasharray =
				dependencyState === "unconfirmed"
					? "3 6"
					: relation.optional
						? (semanticStyle.dash ?? "7 6")
						: semanticStyle.dash;
			return {
				id: `${relation.source}-${relation.type}-${relation.target}-${index}`,
				source: relation.source,
				target: relation.target,
				label: `${dependencyState ? `${dependencyState} · ` : ""}${relationStrengthLabel(Boolean(relation.optional), french)} · ${relationSemanticLabel(semantic, french)} · ${relation.type}`,
				animated: Boolean(
					dependencyState !== "unconfirmed" &&
						!relation.optional &&
						semanticStyle.animated,
				),
				markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
				style: {
					stroke,
					strokeWidth:
						dependencyState === "blocked" ? 3 : relation.optional ? 1.5 : 2.4,
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
					dependencyState,
				},
			};
		});
}
