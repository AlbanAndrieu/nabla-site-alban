import {
	catalogV2ServiceViews,
	type HomelabCatalogV2,
} from "./homelabCatalogV2";
import type { HomelabServicesCatalog } from "./homelabServices";
import type {
	ServiceRelationType,
	ServiceTopology,
} from "./serviceTopology";

/** One canonical Backstage v2 source for cards and the architecture graph. */
export function projectHomelabCatalogV2(catalog: HomelabCatalogV2): {
	services: HomelabServicesCatalog;
	topology: ServiceTopology;
} {
	const views = catalogV2ServiceViews(catalog);
	const duplicates = new Map<string, number>();
	for (const view of views) {
		duplicates.set(view.id, (duplicates.get(view.id) ?? 0) + 1);
	}
	// Stable canonical identity survives collisions across Backstage kinds.
	const byRef = new Map(
		views.map((view) => [
			view.entityRef,
			(duplicates.get(view.id) ?? 0) > 1
				? `${view.entityKind.toLowerCase()}-${view.id}`
				: view.id,
		]),
	);
	const services: HomelabServicesCatalog = {
		version: 2,
		catalogRevision: catalog.catalogRevision,
		services: views.map((view) => ({
			id: byRef.get(view.entityRef),
			entityRef: view.entityRef,
			name: view.name,
			description: view.description,
			kind: view.type ?? view.entityKind.toLowerCase(),
			category: view.category ?? "other",
			criticality: view.operationalCriticality,
			// No endpoint, tunnel, internal host or port exists in the safe v2 DTO.
			endpointEnabled: false,
		})),
	};
	const nodes: ServiceTopology["nodes"] = views.map((view) => ({
		id: byRef.get(view.entityRef) ?? view.id,
		name: view.name,
		kind: view.type ?? view.entityKind.toLowerCase(),
		category: view.category ?? "other",
		criticality: view.operationalCriticality,
		securityFunctions: view.securityFunctions,
		sourcePath: view.sourcePath,
	}));
	const relationFields = {
		dependsOn: "dependsOn",
		consumesApis: "consumesApi",
		providesApis: "providesApi",
		subcomponentOf: "partOf",
	} as const satisfies Record<string, ServiceRelationType>;
	const relations: ServiceTopology["relations"] = [];
	const seen = new Set<string>();
	for (const entity of catalog.entities) {
		const source = byRef.get(entity.entityRef);
		if (!source) continue;
		for (const [field, type] of Object.entries(relationFields) as [
			keyof typeof relationFields,
			ServiceRelationType,
		][]) {
			const refs = entity.spec[field];
			if (!Array.isArray(refs)) continue;
			for (const ref of refs) {
				if (typeof ref !== "string") continue;
				const target = byRef.get(ref);
				if (!target || target === source) continue;
				const key = `${source}:${target}:${type}`;
				if (seen.has(key)) continue;
				seen.add(key);
				relations.push({
					source,
					target,
					type,
					strength: "required",
					evidence: [],
				});
			}
		}
	}
	return {
		services,
		topology: {
			version: 2,
			catalogRevision: catalog.catalogRevision,
			name: "Nabla Backstage v2",
			nodes,
			relations,
		},
	};
}
