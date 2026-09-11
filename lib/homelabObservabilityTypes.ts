import type { HomelabDiagnosticsSnapshot } from "./homelabDiagnostics";
import type { HomelabHealthSnapshot } from "./homelabHealth";
import type {
	HomelabOperationalEvidence,
	OperationalComponentEvidence,
	OperationalHealthState,
} from "./homelabOperationalEvidence";
import type { RuntimeTopologySnapshot } from "./runtimeTopology";

export type ProbeCacheEvidence = {
	layer?: string;
	cached?: boolean;
	stale?: boolean;
	refreshInProgress?: boolean;
	redisAvailable?: boolean;
	ageSeconds?: number;
};

export type ControlPlaneDiagnosticEvidence = {
	cache?: ProbeCacheEvidence;
	exceptionType?: string;
	probe?: string;
	path?: string;
	retryAfterSeconds?: number;
	verifySsl?: boolean;
};

export type DeepDiagnosticCategory =
	| "required"
	| "control-plane"
	| "integration"
	| "homelab";

export type DeepDiagnosticCheckEvidence = {
	id: string;
	label: string;
	category: DeepDiagnosticCategory;
	state: OperationalHealthState;
	reachable: boolean | null;
	skipped: boolean;
	reason?: string;
	error?: string;
	errorKind?: string;
	exceptionType?: string;
	elapsedMs?: number;
	httpStatus?: number;
	tlsTrusted?: boolean | null;
	probe?: string;
	authentication?: string;
	resource?: string;
	path?: string;
	target?: string;
	degraded?: boolean;
	cache?: ProbeCacheEvidence;
};

export type PfSenseIngressPolicyEvidence = {
	state: string;
	accessPolicy?: string;
	activeEgressIps: string[];
	possibleCauses: string[];
	attributionAvailable: boolean | null;
	detail?: string;
	recommendedControlPath?: string;
};

export type DeepDiagnosticEvidence = {
	contract?: string;
	status?: string;
	version?: string;
	checks: DeepDiagnosticCheckEvidence[];
};

export type EdgeEvidenceSkip = {
	id: string;
	reason: string;
};

export type CloudflareCacheEvidence = {
	stale: boolean;
	refreshError?: string;
	cache?: ProbeCacheEvidence;
};

export type PlatformMetricKey =
	| "truenas_memory_available_ratio"
	| "truenas_cpu_busy_ratio"
	| "truenas_node_up"
	| "truenas_cadvisor_up"
	| "pfsense_metrics_up"
	| "prometheus_up";

export type PlatformMetricSample = {
	metric: string;
	value: number | null;
};

export type PlatformMetricsEvidence = {
	schemaVersion?: number;
	generatedAt?: string;
	state:
		| "healthy"
		| "degraded"
		| "not_configured"
		| "telemetry_unavailable"
		| "unknown";
	configured: boolean | null;
	source?: string;
	errorKind?: string;
	exceptionType?: string;
	metrics: Partial<Record<PlatformMetricKey, PlatformMetricSample>>;
	summary: {
		signalsAvailable: number;
		signalsTotal: number;
		telemetryUp: number;
		telemetryTotal: number;
		truenasMemoryAvailableRatio?: number;
		truenasCpuBusyRatio?: number;
		pfsenseMetricsUp?: number;
	};
};

export type HomelabObservabilitySource =
	| "health-board"
	| "fallback"
	| "unavailable";

export type HomelabObservabilitySnapshot = HomelabOperationalEvidence & {
	healthSnapshot: HomelabHealthSnapshot | null;
	runtimeTopology: RuntimeTopologySnapshot | null;
	deepDiagnostics: DeepDiagnosticEvidence;
	diagnostics: HomelabDiagnosticsSnapshot | null;
	cloudflareCache: CloudflareCacheEvidence | null;
	platformMetrics: PlatformMetricsEvidence | null;
	pfsenseIngressPolicy: PfSenseIngressPolicyEvidence | null;
	edgeEvidenceSkips: EdgeEvidenceSkip[];
	controlPlaneDiagnostics: Partial<
		Record<OperationalComponentEvidence["id"], ControlPlaneDiagnosticEvidence>
	>;
	sources: {
		board: "health-board";
		runtime: HomelabObservabilitySource;
		diagnostics: HomelabObservabilitySource;
	};
};
