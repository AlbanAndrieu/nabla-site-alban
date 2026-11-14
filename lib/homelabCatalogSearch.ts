import { homelabServiceId, type HomelabService } from "./homelabServices";

/**
 * One SERVICE-safe search policy for TrueNAS and Architecture.
 * The query is normalized once by each caller; never search OWNER evidence.
 */
export function matchesCatalogServiceSearch(
	service: HomelabService,
	normalizedQuery: string,
): boolean {
	if (!normalizedQuery) return true;
	const match = (value: string | undefined) =>
		typeof value === "string" && value.toLowerCase().includes(normalizedQuery);
	return (
		match(service.name) ||
		match(homelabServiceId(service)) ||
		match(service.kind) ||
		match(service.category) ||
		match(service.lifecycle) ||
		match(service.catalogEntityKind) ||
		match(service.criticality) ||
		match(service.businessCriticality)
	);
}
