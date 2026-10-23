/** The SERVICE catalog has one visible identity per service; never invent aliases. */
const SERVICE_KINDS = new Set(["Component", "Resource", "API"]);

type NamedEntity = {
	kind: string;
	metadata: { name: string; title?: string };
};

/** Stable service-card anchor, without any collision-repair suffix. */
export function catalogServiceSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** A catalog with ambiguous visible service names is not safe to publish. */
export function hasUniqueCatalogServiceNames(
	entities: readonly NamedEntity[],
): boolean {
	const names = new Set<string>();
	const labels = new Set<string>();
	const slugs = new Set<string>();
	for (const entity of entities) {
		if (!SERVICE_KINDS.has(entity.kind)) continue;
		const name = entity.metadata.name.trim().toLowerCase();
		const title = entity.metadata.title;
		if (title !== undefined && typeof title !== "string") return false;
		const label = (title ?? entity.metadata.name)
			.normalize("NFKC")
			.trim()
			.replace(/\s+/g, " ")
			.toLowerCase();
		const slug = catalogServiceSlug(entity.metadata.name);
		if (
			!name ||
			!label ||
			!slug ||
			names.has(name) ||
			labels.has(label) ||
			slugs.has(slug)
		)
			return false;
		names.add(name);
		labels.add(label);
		slugs.add(slug);
	}
	return true;
}
