import type { HomelabHealthState } from "@/lib/homelabHealth";
import type { ServiceCriticalityTier } from "@/lib/serviceCriticality";
import type { ArchitectureEntity } from "./architectureData";
import styles from "./HierarchicalArchitectureExplorer.module.css";

export type GraphMode = "ai" | "services";
export type GraphScope = "critical" | "all";
export type FlowDirection = "down" | "up";
export type ServiceGroupKey =
	| ServiceCriticalityTier
	| "external"
	| "runtime-drift";
export type GroupKey = `ai-${number}` | ServiceGroupKey;
export type RelationSemantic =
	| "dependency"
	| "flow"
	| "exposure"
	| "placement"
	| "observation"
	| "automation";

export type ArchitectureNodeData = Record<string, unknown> & {
	name: string;
	kind: string;
	category: string;
	url?: string;
	detail?: string;
	icon?: string;
	iconSrc?: string;
	openLabel: string;
	flowDirection: FlowDirection;
	french: boolean;
	reconciliation?: string;
	runtimeState?: string;
	healthState?: HomelabHealthState;
	localHealthState?: HomelabHealthState;
	blockedBy?: string[];
	degradedBy?: string[];
	unconfirmedDependencies?: string[];
	tlsTrusted?: boolean | null;
	cloudflareObserved?: boolean;
	cloudflareStatus?: string | null;
	cloudflareColor?: string;
	applicationError?: string | null;
	criticalityTier?: ServiceCriticalityTier;
	blastRadius?: number;
	blastRadiusLevel?: "dominant" | "elevated";
};

export type GroupNodeData = Record<string, unknown> & {
	label: string;
	description: string;
	groupKey: GroupKey;
	count: number;
	flowHint: string;
};

export type GraphGroup = {
	id: string;
	key: GroupKey;
	label: string;
	description: string;
	flowHint: string;
	entities: ArchitectureEntity[];
	flowDirection: FlowDirection;
};

export const NODE_WIDTH = 224;
export const NODE_ROW_HEIGHT = 205;
export const GROUP_PADDING_X = 34;
export const GROUP_HEADER_HEIGHT = 78;
export const GROUP_GAP = 36;
export const COLUMN_GAP = 30;
export const MAX_COLUMNS = 5;
export const GROUP_WIDTH =
	GROUP_PADDING_X * 2 +
	NODE_WIDTH * MAX_COLUMNS +
	COLUMN_GAP * (MAX_COLUMNS - 1);

export const SERVICE_GROUP_ORDER: readonly ServiceGroupKey[] = [
	"foundation",
	"shared-data",
	"shared-platform",
	"application",
	"support",
	"external",
	"runtime-drift",
];

export const RELATION_STYLE: Record<
	RelationSemantic,
	{ color: string; dash?: string; animated?: boolean }
> = {
	dependency: { color: "#38bdf8", animated: true },
	flow: { color: "#60a5fa", animated: true },
	exposure: { color: "#c084fc", dash: "11 5" },
	placement: { color: "#94a3b8", dash: "2 5" },
	observation: { color: "#4ade80", dash: "4 6" },
	automation: { color: "#fbbf24", dash: "10 4 2 4", animated: true },
};

export function relationSemantic(type: string): RelationSemantic {
	if (["dependsOn", "storesIn", "authenticatesVia", "cache"].includes(type)) {
		return "dependency";
	}
	if (["exposedBy"].includes(type)) return "exposure";
	if (["partOf", "hostedBy"].includes(type)) return "placement";
	if (
		["observedBy", "telemetry", "metrics", "traces", "evaluation"].includes(
			type,
		)
	) {
		return "observation";
	}
	if (["automates", "document workflow"].includes(type)) return "automation";
	return "flow";
}

export function relationSemanticLabel(
	semantic: RelationSemantic,
	french: boolean,
): string {
	const labels: Record<RelationSemantic, [string, string]> = {
		dependency: ["dependency", "dépendance"],
		flow: ["API/data flow", "flux API/données"],
		exposure: ["exposure", "exposition"],
		placement: ["placement", "hébergement"],
		observation: ["observation", "observabilité"],
		automation: ["automation", "automatisation"],
	};
	return labels[semantic][french ? 1 : 0];
}

export function relationSemanticClass(semantic: RelationSemantic): string {
	switch (semantic) {
		case "dependency":
			return styles.edgeDependency;
		case "flow":
			return styles.edgeFlow;
		case "exposure":
			return styles.edgeExposure;
		case "placement":
			return styles.edgePlacement;
		case "observation":
			return styles.edgeObservation;
		case "automation":
			return styles.edgeAutomation;
	}
}

export function relationStrengthLabel(
	optional: boolean,
	french: boolean,
): string {
	if (french) return optional ? "optionnelle" : "requise";
	return optional ? "optional" : "required";
}
