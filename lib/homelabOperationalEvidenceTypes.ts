import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";

export type OperationalHealthState = "ok" | "warn" | "fail" | "unknown";

export type OperationalComponentEvidence = {
	id: "truenas" | "pfsense" | "cloudflare";
	state: OperationalHealthState;
	reachable: boolean | null;
	stale: boolean;
	tlsTrusted?: boolean | null;
	httpStatus?: number;
	apiReachable?: boolean | null;
	elapsedMs?: number;
	attempts?: number;
	failureStage?: string;
	errorKind?: string;
	error?: string;
	refreshError?: string;
	lastSuccessAt?: string;
	credentialMode?: string;
	tunnelCount?: number;
	healthyTunnels?: number;
	unhealthyTunnels?: number;
	tunnelStatuses?: string[];
};

export type PfSenseSecurityFilterEvidence = {
	id: string;
	label: string;
	state: string;
	detail: string;
};

export type PfSenseIngressEvidence = {
	state: string;
	telemetryAvailable: boolean | null;
	attributionAvailable: boolean | null;
	engine?: string;
	firewall?: string;
	mechanism?: string;
	evidence?: string;
	sourceIp?: string | null;
	destinationIp?: string | null;
	destinationPort?: number;
	controlPath?: {
		mode?: string;
		independentFromWanFilter: boolean | null;
		blindSpot: boolean;
		detail?: string;
	};
};

export type PfSensePostureEvidence = {
	configured: boolean | null;
	reachable: boolean | null;
	policyState: OperationalHealthState;
	reason?: string;
	errorStage?: string;
	error?: string;
	securityFilters: PfSenseSecurityFilterEvidence[];
	ingressBlock: PfSenseIngressEvidence | null;
};

export type ExposurePortEvidence = {
	port: number;
	service: string;
	observedReachable: boolean | null;
	expectedReachable: boolean | null;
	accessPolicy?: string;
	defaultAction?: string;
	expectedFrom: string[];
	negativeProbeRequired: boolean;
	reason?: string;
	state: OperationalHealthState;
};

export type ProviderCredentialEvidence = {
	provider: string;
	configured: boolean;
	configurationStage?: string;
	credentialMode?: string;
	missingVariables: string[];
	invalidReferenceVariables: string[];
	requiredPrivilege?: string;
	writePrivilegesRequired?: boolean;
};

export type StaleServiceEvidence = {
	id: string;
	name: string;
	observationAgeSeconds?: number;
};

export type DependencyCycleEvidence = {
	members: string[];
};

export type TroubleshootingFocus =
	| "pfsense_block"
	| "pfsense_blind_spot"
	| "pfsense_control"
	| "cloudflare"
	| "truenas"
	| "stale_evidence"
	| "dependency_cycle"
	| "dependencies";

export type HomelabOperationalEvidence = {
	board: {
		state: FastApiHealthBoardSnapshot["state"];
		refreshing: boolean;
		ageSeconds?: number;
		generatedAt: string | null;
		error?: string | null;
	};
	componentsStatus?: string;
	components: OperationalComponentEvidence[];
	pfsense: PfSensePostureEvidence | null;
	exposurePorts: ExposurePortEvidence[];
	providerCredentials: ProviderCredentialEvidence[];
	refreshElapsedMs?: number;
	staleServices: StaleServiceEvidence[];
	dependencyCycles: DependencyCycleEvidence[];
	troubleshootingFocus: TroubleshootingFocus;
};
