import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";
import {
	healthState,
	isRecord,
	optionalBoolean,
	optionalNumber,
	optionalString,
	stringArray,
} from "./homelabOperationalEvidenceParsing";
import { parseExposurePorts } from "./homelabOperationalExposure";
import {
	deriveTroubleshootingFocus,
	parseFreshnessEvidence,
} from "./homelabOperationalFreshness";
import { parsePfSensePosture } from "./homelabOperationalPfSense";

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

function deriveComponentState(
	raw: Record<string, unknown>,
): OperationalHealthState {
	const explicit = healthState(raw.state);
	if (explicit) return explicit;
	if (raw.reachable === false) return "fail";
	if (
		raw.stale === true ||
		raw.degraded === true ||
		raw.tls_trusted === false
	) {
		return "warn";
	}
	if (raw.reachable === true) return "ok";
	return "unknown";
}

function parseComponentEvidence(
	id: OperationalComponentEvidence["id"],
	value: unknown,
): OperationalComponentEvidence {
	const raw = isRecord(value) ? value : {};
	return {
		id,
		state: deriveComponentState(raw),
		reachable: optionalBoolean(raw.reachable),
		stale: raw.stale === true,
		...(raw.tls_trusted === null || typeof raw.tls_trusted === "boolean"
			? { tlsTrusted: raw.tls_trusted as boolean | null }
			: {}),
		...(optionalNumber(raw.http_status) !== undefined
			? { httpStatus: optionalNumber(raw.http_status) }
			: {}),
		...(raw.api_reachable === null || typeof raw.api_reachable === "boolean"
			? { apiReachable: raw.api_reachable as boolean | null }
			: {}),
		...(optionalNumber(raw.elapsed_ms) !== undefined
			? { elapsedMs: optionalNumber(raw.elapsed_ms) }
			: {}),
		...(optionalNumber(raw.attempts) !== undefined
			? { attempts: optionalNumber(raw.attempts) }
			: {}),
		...(optionalString(raw.failure_stage)
			? { failureStage: optionalString(raw.failure_stage) }
			: {}),
		...(optionalString(raw.error_kind)
			? { errorKind: optionalString(raw.error_kind) }
			: {}),
		...(optionalString(raw.error) ? { error: optionalString(raw.error) } : {}),
		...(optionalString(raw.refresh_error)
			? { refreshError: optionalString(raw.refresh_error) }
			: {}),
		...(optionalString(raw.last_success_at)
			? { lastSuccessAt: optionalString(raw.last_success_at) }
			: {}),
		...(optionalString(raw.credential_mode)
			? { credentialMode: optionalString(raw.credential_mode) }
			: {}),
		...(optionalNumber(raw.tunnel_count) !== undefined
			? { tunnelCount: optionalNumber(raw.tunnel_count) }
			: {}),
		...(optionalNumber(raw.healthy_tunnels) !== undefined
			? { healthyTunnels: optionalNumber(raw.healthy_tunnels) }
			: {}),
		...(optionalNumber(raw.unhealthy_tunnels) !== undefined
			? { unhealthyTunnels: optionalNumber(raw.unhealthy_tunnels) }
			: {}),
		...(Array.isArray(raw.tunnel_statuses)
			? { tunnelStatuses: stringArray(raw.tunnel_statuses) }
			: {}),
	};
}

function parseOperationalComponents(
	homelab: Record<string, unknown>,
): OperationalComponentEvidence[] {
	const rawComponents = isRecord(homelab.components) ? homelab.components : {};
	return (["truenas", "pfsense", "cloudflare"] as const).map((id) =>
		parseComponentEvidence(id, rawComponents[id]),
	);
}

function parseProviderCredentials(
	homelab: Record<string, unknown>,
): ProviderCredentialEvidence[] {
	const rawCredentials = isRecord(homelab.provider_credentials)
		? homelab.provider_credentials
		: isRecord(homelab.providerCredentials)
			? homelab.providerCredentials
			: null;
	if (!rawCredentials) return [];
	return Object.values(rawCredentials).flatMap((value) => {
		if (!isRecord(value) || typeof value.configured !== "boolean") return [];
		const provider = optionalString(value.provider);
		if (!provider) return [];
		return [
			{
				provider,
				configured: value.configured,
				...(optionalString(value.configuration_stage)
					? { configurationStage: optionalString(value.configuration_stage) }
					: {}),
				...(optionalString(value.credential_mode)
					? { credentialMode: optionalString(value.credential_mode) }
					: {}),
				missingVariables: stringArray(value.missing_variables),
				invalidReferenceVariables: stringArray(
					value.invalid_reference_variables,
				),
				...(optionalString(value.required_privilege)
					? { requiredPrivilege: optionalString(value.required_privilege) }
					: {}),
				...(typeof value.write_privileges_required === "boolean"
					? { writePrivilegesRequired: value.write_privileges_required }
					: {}),
			},
		];
	});
}

export function parseHomelabOperationalEvidence(
	board: FastApiHealthBoardSnapshot,
): HomelabOperationalEvidence {
	const homelab = isRecord(board.homelab) ? board.homelab : {};
	const components = parseOperationalComponents(homelab);
	const pfsense = parsePfSensePosture(homelab);
	const { staleServices, dependencyCycles } = parseFreshnessEvidence(homelab);
	return {
		board: {
			state: board.state,
			refreshing: board.refreshing,
			...(typeof board.age_seconds === "number"
				? { ageSeconds: board.age_seconds }
				: {}),
			generatedAt: board.generated_at,
			...(board.error !== undefined ? { error: board.error } : {}),
		},
		...(optionalString(homelab.components_status)
			? { componentsStatus: optionalString(homelab.components_status) }
			: {}),
		components,
		pfsense,
		exposurePorts: parseExposurePorts(board.sickz),
		providerCredentials: parseProviderCredentials(homelab),
		...(optionalNumber(homelab.refresh_elapsed_ms) !== undefined
			? { refreshElapsedMs: optionalNumber(homelab.refresh_elapsed_ms) }
			: {}),
		staleServices,
		dependencyCycles,
		troubleshootingFocus: deriveTroubleshootingFocus(
			components,
			pfsense,
			staleServices,
			dependencyCycles,
			board,
		),
	};
}
