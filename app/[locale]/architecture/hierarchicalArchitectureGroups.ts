import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	type ServiceCriticality,
} from "@/lib/serviceCriticality";
import type { ServiceTopology } from "@/lib/serviceTopology";
import type {
	ArchitectureEntity,
	ArchitectureRelation,
} from "./architectureData";
import {
	type GraphGroup,
	type GroupKey,
	SERVICE_GROUP_ORDER,
	type ServiceGroupKey,
} from "./hierarchicalArchitectureModel";

const AI_GROUP_COPY: Record<
	number,
	{ en: [string, string]; fr: [string, string] }
> = {
	0: {
		en: [
			"Interfaces & agents",
			"Human-facing clients and coding/agent entry points.",
		],
		fr: [
			"Interfaces & agents",
			"Clients utilisateurs et points d’entrée des agents/coding agents.",
		],
	},
	1: {
		en: [
			"Control plane",
			"Shared model gateway, routing policy and hot state.",
		],
		fr: [
			"Plan de contrôle",
			"Gateway de modèles, politiques de routage et état partagé à chaud.",
		],
	},
	2: {
		en: ["Inference", "Local and remote model execution targets."],
		fr: ["Inférence", "Cibles d’exécution locales et distantes des modèles."],
	},
	3: {
		en: [
			"Tools & knowledge",
			"MCP tools, search, RAG and document knowledge boundaries.",
		],
		fr: [
			"Outils & connaissances",
			"Outils MCP, recherche, RAG et sources documentaires.",
		],
	},
	4: {
		en: [
			"Orchestration",
			"Workflow engines coordinating long-running and automated work.",
		],
		fr: [
			"Orchestration",
			"Moteurs de workflow coordonnant automatisations et traitements longs.",
		],
	},
	5: {
		en: [
			"Observability & evaluation",
			"Tracing, metrics, quality and evaluation feedback loops.",
		],
		fr: [
			"Observabilité & évaluation",
			"Tracing, métriques, qualité et boucles d’évaluation.",
		],
	},
};

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

export function filterGraph(
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

export function aiGroups(
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
				entities: [...layerEntities].sort((a, b) =>
					a.name.localeCompare(b.name),
				),
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

export function serviceGroups(
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
			return (
				left.category.localeCompare(right.category) ||
				left.name.localeCompare(right.name)
			);
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
