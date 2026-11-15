/** A missing graph must never fabricate dependency edges or expose endpoint URLs. */
import {
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import type { ServiceTopology } from "@/lib/serviceTopology";

export function buildDeclaredServiceTopology(
	catalog: HomelabServicesCatalog,
): ServiceTopology {
	return {
		version: 2,
		catalogRevision: catalog.catalogRevision,
		name: "Backstage v2 — declared services only",
		nodes: catalog.services.map((service) => ({
			id: homelabServiceId(service),
			name: service.name,
			kind: service.kind ?? "service",
			category: service.category ?? "other",
			criticality: service.criticality,
		})),
		relations: [],
	};
}
