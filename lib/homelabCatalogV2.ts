const CATALOG_REVISION_RE = /^sha256:[0-9a-f]{64}$/;

export type BackstageEntityKind =
	| "API"
	| "Component"
	| "Domain"
	| "Group"
	| "Resource"
	| "System";

export type CatalogV2Entity = {
	apiVersion: "backstage.io/v1alpha1";
	kind: BackstageEntityKind;
	entityRef: string;
	sourcePath: string;
	metadata: {
		name: string;
		namespace?: string;
		title?: string;
		description?: string;
		tags?: string[];
		labels?: Record<string, string>;
		annotations?: Record<string, string>;
	};
	spec: Record<string, unknown>;
};

export type HomelabCatalogV2 = {
	schemaVersion: 2;
	model: "backstage";
	catalogRevision: string;
	entities: CatalogV2Entity[];
};

export type CatalogV2ServiceView = {
	id: string;
	entityRef: string;
	name: string;
	description?: string;
	entityKind: "Component" | "Resource" | "API";
	type?: string;
	lifecycle?: string;
	category?: string;
	securityFunctions: string[];
	operationalCriticality?: "critical" | "high" | "medium" | "low";
	businessCriticality?: "critical" | "high" | "medium" | "low";
	sourcePath: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function stringRecord(value: unknown): value is Record<string, string> {
	return (
		isRecord(value) &&
		Object.values(value).every((item) => typeof item === "string")
	);
}

function validEntity(value: unknown): value is CatalogV2Entity {
	if (!isRecord(value) || value.apiVersion !== "backstage.io/v1alpha1") {
		return false;
	}
	if (
		!["API", "Component", "Domain", "Group", "Resource", "System"].includes(
			String(value.kind),
		)
	) {
		return false;
	}
	if (
		typeof value.entityRef !== "string" ||
		typeof value.sourcePath !== "string" ||
		!isRecord(value.metadata) ||
		typeof value.metadata.name !== "string" ||
		!isRecord(value.spec)
	) {
		return false;
	}
	if (
		value.metadata.tags !== undefined &&
		!strings(value.metadata.tags)
	) {
		return false;
	}
	if (
		value.metadata.labels !== undefined &&
		!stringRecord(value.metadata.labels)
	) {
		return false;
	}
	if (
		value.metadata.annotations !== undefined &&
		!stringRecord(value.metadata.annotations)
	) {
		return false;
	}
	return true;
}

export function parseHomelabCatalogV2(value: unknown): HomelabCatalogV2 | null {
	if (
		!isRecord(value) ||
		value.schemaVersion !== 2 ||
		value.model !== "backstage" ||
		typeof value.catalogRevision !== "string" ||
		!CATALOG_REVISION_RE.test(value.catalogRevision) ||
		!Array.isArray(value.entities) ||
		!value.entities.every(validEntity)
	) {
		return null;
	}

	const refs = value.entities.map((entity) => entity.entityRef);
	if (new Set(refs).size !== refs.length) return null;

	return value as HomelabCatalogV2;
}

function criticality(
	value: string | undefined,
): CatalogV2ServiceView["operationalCriticality"] {
	return value && ["critical", "high", "medium", "low"].includes(value)
		? (value as CatalogV2ServiceView["operationalCriticality"])
		: undefined;
}

export function catalogV2ServiceViews(
	catalog: HomelabCatalogV2,
): CatalogV2ServiceView[] {
	return catalog.entities
		.filter(
			(entity): entity is CatalogV2Entity & {
				kind: "Component" | "Resource" | "API";
			} => ["Component", "Resource", "API"].includes(entity.kind),
		)
		.map((entity) => {
			const tags = entity.metadata.tags ?? [];
			const labels = entity.metadata.labels ?? {};
			const securityFunctions = tags
				.filter((tag) => tag.startsWith("nist-"))
				.map((tag) => tag.slice("nist-".length));
			const category = tags.find((tag) => !tag.startsWith("nist-"));
			const type =
				typeof entity.spec.type === "string" ? entity.spec.type : undefined;
			const lifecycle =
				typeof entity.spec.lifecycle === "string"
					? entity.spec.lifecycle
					: undefined;

			return {
				id: entity.metadata.name,
				entityRef: entity.entityRef,
				name: entity.metadata.title ?? entity.metadata.name,
				description: entity.metadata.description,
				entityKind: entity.kind,
				type,
				lifecycle,
				category,
				securityFunctions,
				operationalCriticality: criticality(
					labels["albandrieu.com/operational-criticality"],
				),
				businessCriticality: criticality(
					labels["albandrieu.com/business-criticality"],
				),
				sourcePath: entity.sourcePath,
			};
		})
		.sort((left, right) => left.entityRef.localeCompare(right.entityRef));
}
