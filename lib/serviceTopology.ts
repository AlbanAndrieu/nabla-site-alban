/** Graph view model, built only by projectHomelabCatalogV2: IDs are entity refs. */
import type { ServiceCriticalityLevel } from "./serviceCriticalityLevel";

export type ServiceDeploymentEnvironment = {
	name: "production" | "staging" | "dev";
	url: string;
	external: boolean;
	cloudflareTunnel: boolean;
};

export type ServiceLifecyclePhase =
	| "bootstrap-runtime"
	| "foundation"
	| "network-edge"
	| "primary-data"
	| "secondary-data"
	| "platform-services"
	| "applications";

export type ServiceLifecycle = {
	phase: ServiceLifecyclePhase;
	priority: number;
};

export type ServiceTopologyNode = {
	id: string;
	name: string;
	kind: string;
	category: string;
	presentationRole?: "service" | "core" | "support";
	criticality?: ServiceCriticalityLevel;
	lifecycle?: ServiceLifecycle;
	sourcePath?: string;
	url?: string;
	internalUrl?: string;
	description?: string;
	icon?: string;
	securityFunctions?: string[];
	environments?: ServiceDeploymentEnvironment[];
};

export type ServiceRelationType =
	| "dependsOn"
	| "consumesApi"
	| "providesApi"
	| "partOf"
	| "hostedBy"
	| "routesTo"
	| "observedBy"
	| "storesIn"
	| "authenticatesVia"
	| "exposedBy"
	| "automates";

export type ServiceTopologyRelation = {
	source: string;
	target: string;
	type: ServiceRelationType;
	strength: "required" | "optional";
	description?: string;
	evidence: string[];
};

export type ServiceTopology = {
	version: number;
	catalogRevision?: string;
	topologyVersion?: number;
	name: string;
	nodes: ServiceTopologyNode[];
	relations: ServiceTopologyRelation[];
};

export type ServiceTopologySource = "fastapi" | "local-fallback";
