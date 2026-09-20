import localCatalogV2 from "../public/service-catalog-v2.json";

export type ServiceCatalogV2Endpoint = {
	type: string;
	url: string;
	external?: boolean;
	cloudflareTunnel?: boolean;
};

export type ServiceCatalogV2Entity = {
	id: string;
	ref: string;
	name: string;
	entityType: "component" | "resource";
	subtype: string;
	domain: string;
	system: string;
	sourcePath: string;
	deploymentStatus: "active" | "planned" | "disabled";
	description?: string;
	endpoints?: ServiceCatalogV2Endpoint[];
	presentation?: {
		presentationRole?: "service" | "core" | "support";
		criticality?: "critical" | "high" | "medium" | "low";
		icon?: string;
	};
	security?: { functions?: string[] };
	runtime?: Record<string, unknown>;
	monitoring?: Record<string, unknown>;
	lifecycle?: Record<string, unknown>;
	standards: {
		backstage: { entityRef: string };
		cyclonedx: { bomRef: string };
	};
	integrations: {
		cartography: {
			joinProperty: "nabla_ref";
			joinValue: string;
		};
	};
};

export type ServiceCatalogV2Relation = {
	source: string;
	target: string;
	sourceRef: string;
	targetRef: string;
	type: string;
	strength: "required" | "optional";
	description?: string;
	evidence: string[];
};

export type ServiceCatalogV2 = {
	apiVersion: "nabla.dev/v2";
	kind: "ServiceCatalog";
	metadata: {
		name: string;
		catalogRevision: string;
		topologyVersion: number;
		authoritativeSource: "x-nabla";
		state: "declared";
	};
	entities: ServiceCatalogV2Entity[];
	relations: ServiceCatalogV2Relation[];
};

export type ServiceCatalogV2Source = "fastapi-v2" | "local-v2";

export const SERVICE_CATALOG_V2_API_ENV = "HOMELAB_CATALOG_V2_API_URL";
const PRIMARY_TIMEOUT_MS = 2500;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseServiceCatalogV2(value: unknown): ServiceCatalogV2 | null {
	if (
		!isRecord(value) ||
		value.apiVersion !== "nabla.dev/v2" ||
		value.kind !== "ServiceCatalog" ||
		!isRecord(value.metadata) ||
		typeof value.metadata.catalogRevision !== "string" ||
		typeof value.metadata.topologyVersion !== "number" ||
		value.metadata.authoritativeSource !== "x-nabla" ||
		value.metadata.state !== "declared" ||
		!Array.isArray(value.entities) ||
		!Array.isArray(value.relations)
	) {
		return null;
	}

	const entities = value.entities;
	if (
		!entities.every(
			(entity) =>
				isRecord(entity) &&
				typeof entity.id === "string" &&
				typeof entity.ref === "string" &&
				typeof entity.name === "string" &&
				(entity.entityType === "component" ||
					entity.entityType === "resource") &&
				typeof entity.subtype === "string" &&
				typeof entity.domain === "string" &&
				typeof entity.sourcePath === "string" &&
				["active", "planned", "disabled"].includes(
					String(entity.deploymentStatus),
				) &&
				isRecord(entity.standards) &&
				isRecord(entity.standards.backstage) &&
				typeof entity.standards.backstage.entityRef === "string" &&
				isRecord(entity.standards.cyclonedx) &&
				typeof entity.standards.cyclonedx.bomRef === "string" &&
				isRecord(entity.integrations) &&
				isRecord(entity.integrations.cartography) &&
				entity.integrations.cartography.joinProperty === "nabla_ref" &&
				typeof entity.integrations.cartography.joinValue === "string",
		)
	) {
		return null;
	}

	const ids = new Set(entities.map((entity) => String(entity.id)));
	const refs = new Set(entities.map((entity) => String(entity.ref)));
	if (ids.size !== entities.length || refs.size !== entities.length) return null;

	if (
		!value.relations.every(
			(relation) =>
				isRecord(relation) &&
				typeof relation.source === "string" &&
				typeof relation.target === "string" &&
				typeof relation.sourceRef === "string" &&
				typeof relation.targetRef === "string" &&
				typeof relation.type === "string" &&
				(relation.strength === "required" ||
					relation.strength === "optional") &&
				Array.isArray(relation.evidence) &&
				relation.evidence.every((entry) => typeof entry === "string") &&
				ids.has(relation.source) &&
				ids.has(relation.target) &&
				refs.has(relation.sourceRef) &&
				refs.has(relation.targetRef),
		)
	) {
		return null;
	}

	return value as ServiceCatalogV2;
}

const parsedLocal = parseServiceCatalogV2(localCatalogV2);
if (!parsedLocal) {
	throw new Error("Invalid local service-catalog-v2.json fallback");
}
const LOCAL_V2 = parsedLocal;

export function getStaticServiceCatalogV2(): {
	catalog: ServiceCatalogV2;
	source: "local-v2";
} {
	return { catalog: LOCAL_V2, source: "local-v2" };
}

export function serviceCatalogV2EntityById(
	catalog: ServiceCatalogV2,
): Map<string, ServiceCatalogV2Entity> {
	return new Map(catalog.entities.map((entity) => [entity.id, entity]));
}

export function serviceCatalogV2ToTopologyPayload(
	catalog: ServiceCatalogV2,
): Record<string, unknown> {
	const nodes = catalog.entities.map((entity) => {
		const primary = entity.endpoints?.find(
			(endpoint) => endpoint.type === "primary",
		);
		const internal = entity.endpoints?.find(
			(endpoint) => endpoint.type === "internal",
		);
		const environments = entity.endpoints
			?.filter((endpoint) =>
				["production", "staging", "dev"].includes(endpoint.type),
			)
			.map((endpoint) => ({
				name: endpoint.type,
				url: endpoint.url,
				external: endpoint.external ?? false,
				cloudflareTunnel: endpoint.cloudflareTunnel ?? false,
			}));

		return {
			id: entity.id,
			name: entity.name,
			kind: entity.subtype,
			category: entity.domain,
			sourcePath: entity.sourcePath,
			...(entity.description ? { description: entity.description } : {}),
			...(primary ? { url: primary.url } : {}),
			...(internal ? { internalUrl: internal.url } : {}),
			...(environments?.length ? { environments } : {}),
			...(entity.presentation ?? {}),
			...(entity.security?.functions?.length
				? { securityFunctions: entity.security.functions }
				: {}),
			...(entity.lifecycle ? { lifecycle: entity.lifecycle } : {}),
		};
	});

	const relations = catalog.relations.map(
		({ sourceRef: _sourceRef, targetRef: _targetRef, ...relation }) => relation,
	);

	return {
		version: catalog.metadata.topologyVersion,
		catalogRevision: catalog.metadata.catalogRevision,
		topologyVersion: catalog.metadata.topologyVersion,
		name: catalog.metadata.name,
		nodes,
		relations,
	};
}

export async function loadServiceCatalogV2(): Promise<{
	catalog: ServiceCatalogV2;
	source: ServiceCatalogV2Source;
	primaryUrl: string | null;
}> {
	const primaryUrl = process.env[SERVICE_CATALOG_V2_API_ENV]?.trim() || null;
	if (!primaryUrl) {
		return { catalog: LOCAL_V2, source: "local-v2", primaryUrl: null };
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);
	try {
		const response = await fetch(primaryUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": "nabla-site-service-catalog-v2/1.0",
			},
			signal: controller.signal,
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const catalog = parseServiceCatalogV2(await response.json());
		if (!catalog || catalog.entities.length === 0) {
			throw new Error("Invalid service catalog v2 payload");
		}
		return { catalog, source: "fastapi-v2", primaryUrl };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[service-catalog-v2] upstream unavailable (${primaryUrl}): ${reason}; using local v2 fallback`,
		);
		return { catalog: LOCAL_V2, source: "local-v2", primaryUrl };
	} finally {
		clearTimeout(timeout);
	}
}
