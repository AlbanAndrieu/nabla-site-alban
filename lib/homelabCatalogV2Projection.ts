import {
	catalogV2ServiceViews,
	type HomelabCatalogV2,
} from "./homelabCatalogV2";
import type { HomelabServicesCatalog } from "./homelabServices";
import type { ServiceRelationType, ServiceTopology } from "./serviceTopology";

/** Pick one stable, URL-safe service ID per canonical Backstage entity reference. */
function stableServiceIds(
	views: ReturnType<typeof catalogV2ServiceViews>,
): Map<string, string> {
	const names = new Map<string, number>();
	for (const view of views) {
		names.set(view.id, (names.get(view.id) ?? 0) + 1);
	}
	const initial = views.map((view) =>
		(names.get(view.id) ?? 0) > 1
			? `${view.entityKind.toLowerCase()}-${view.id}`
			: view.id,
	);
	const counts = new Map<string, number>();
	for (const id of initial) counts.set(id, (counts.get(id) ?? 0) + 1);

	// Reserve non-conflicting IDs first so a disambiguation never steals one.
	const reserved = new Set(initial.filter((id) => counts.get(id) === 1));
	const used = new Set<string>();
	const byRef = new Map<string, string>();
	for (const [index, view] of views.entries()) {
		const base = initial[index];
		if (!base) throw new Error("Missing Backstage service identity");
		let id = base;
		if ((counts.get(base) ?? 0) > 1) {
			const namespace = view.entityRef.split(":", 2)[1]?.split("/", 1)[0];
			const normalizedNamespace = (namespace ?? "default")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");
			const safeNamespace = normalizedNamespace || "default";
			const stem = `${view.entityKind.toLowerCase()}-${safeNamespace}-${view.id}`;
			id = stem;
			let suffix = 2;
			while (reserved.has(id) || used.has(id)) {
				id = `${stem}-${suffix++}`;
			}
		}
		if (used.has(id)) throw new Error("Duplicate Backstage service identity");
		used.add(id);
		byRef.set(view.entityRef, id);
	}
	return byRef;
}

/** One canonical Backstage v2 source for cards and the architecture graph. */
export function projectHomelabCatalogV2(catalog: HomelabCatalogV2): {
	services: HomelabServicesCatalog;
	topology: ServiceTopology;
} {
	const views = catalogV2ServiceViews(catalog);
	const byRef = stableServiceIds(views);
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
