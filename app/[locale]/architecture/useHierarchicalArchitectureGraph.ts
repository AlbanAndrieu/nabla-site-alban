"use client";

import { useMemo, useState } from "react";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import type { HomelabStatusSnapshot } from "@/lib/homelabStatus";
import { analyzeServiceCriticality } from "@/lib/serviceCriticality";
import type { ServiceTopology } from "@/lib/serviceTopology";
import {
	AI_ENTITIES,
	AI_RELATIONS,
	type ArchitectureEntity,
	buildNablaEntities,
	buildNablaRelations,
} from "./architectureData";
import { buildGroupedNodes, makeEdges } from "./hierarchicalArchitectureFlow";
import {
	aiGroups,
	filterGraph,
	serviceGroups,
} from "./hierarchicalArchitectureGroups";
import type { GraphMode, GraphScope } from "./hierarchicalArchitectureModel";
import useArchitectureRuntimeStatus from "./useArchitectureRuntimeStatus";

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

type GraphInputs = {
	french: boolean;
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	healthStatus: HomelabHealthSnapshot | null;
	readOnly?: boolean;
	initialMode?: GraphMode;
};

export default function useHierarchicalArchitectureGraph({
	french,
	catalog,
	topology,
	healthStatus,
	readOnly = false,
	initialMode = "ai",
}: GraphInputs) {
	const [mode, setMode] = useState<GraphMode>(initialMode);
	const [scope, setScope] = useState<GraphScope>("critical");
	const [showOptional, setShowOptional] = useState(true);
	const [query, setQuery] = useState("");
	const { runtimeStatus, runtimeSource } =
		useArchitectureRuntimeStatus(readOnly);

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
	const criticality = useMemo(
		() => analyzeServiceCriticality(topology),
		[topology],
	);
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
	const servicesRelations = useMemo(
		() => buildNablaRelations(topology),
		[topology],
	);
	const allEntities = mode === "ai" ? AI_ENTITIES : servicesEntities;
	const relations = mode === "ai" ? AI_RELATIONS : servicesRelations;
	const topologyIds = useMemo(
		() => new Set(topology.nodes.map((node) => node.id)),
		[topology],
	);
	const scopedEntities = useMemo(() => {
		if (mode !== "services" || scope === "all" || query.trim())
			return allEntities;
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
				french,
			),
		[criticality, french, groups, healthById, mode, statusById],
	);
	const edges = useMemo(
		() =>
			makeEdges(
				relations,
				filtered.visible,
				healthById,
				showOptional,
				french,
				mode,
			),
		[filtered.visible, french, healthById, mode, relations, showOptional],
	);
	const availability = runtimeAvailability(runtimeStatus, french);

	return {
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
	};
}
