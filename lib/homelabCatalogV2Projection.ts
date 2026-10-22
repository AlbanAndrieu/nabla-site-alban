import {
	catalogV2ServiceViews,
	type HomelabCatalogV2,
} from "./homelabCatalogV2";
import { catalogServiceSlug } from "./homelabCatalogV2Names";
import type { HomelabServicesCatalog } from "./homelabServices";
import type { ServiceRelationType, ServiceTopology } from "./serviceTopology";

/** One canonical Backstage v2 source for cards and the architecture graph. */
export function projectHomelabCatalogV2(catalog: HomelabCatalogV2): {
	services: HomelabServicesCatalog;
	topology: ServiceTopology;
} {
	const views = catalogV2ServiceViews(catalog);
	// The parser rejects duplicate names, display titles and card slugs.
	const byRef = new Map(
		views.map((view) => [view.entityRef, catalogServiceSlug(view.id)]),
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
			const raw = entity.spec[field];
			// Backstage's subcomponentOf is a scalar reference, unlike dependsOn.
			const refs =
				field === "subcomponentOf" && typeof raw === "string"
					? [raw]
					: Array.isArray(raw)
						? raw
						: [];
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
	// Stable React Flow edges regardless of the order received from FastAPI.
	relations.sort(
		(left, right) =>
			left.source.localeCompare(right.source) ||
			left.target.localeCompare(right.target) ||
			left.type.localeCompare(right.type),
	);
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
