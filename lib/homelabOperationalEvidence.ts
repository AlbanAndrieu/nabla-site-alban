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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function optionalBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
		: [];
}

function healthState(value: unknown): OperationalHealthState | null {
	return value === "ok" || value === "warn" || value === "fail" || value === "unknown"
		? value
		: null;
}

function deriveComponentState(raw: Record<string, unknown>): OperationalHealthState {
	const explicit = healthState(raw.state);
	if (explicit) return explicit;
	if (raw.reachable === false) return "fail";
	if (raw.stale === true || raw.degraded === true || raw.tls_trusted === false) return "warn";
	if (raw.reachable === true) return "ok";
	return "unknown";
}

function componentEvidence(
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
		...(optionalString(raw.error_kind) ? { errorKind: optionalString(raw.error_kind) } : {}),
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

function parseIngressBlock(value: unknown): PfSenseIngressEvidence | null {
	if (!isRecord(value)) return null;
	const control = isRecord(value.control_path) ? value.control_path : null;
	const source = isRecord(value.source) ? value.source : null;
	const destination = isRecord(value.destination) ? value.destination : null;
	return {
		state: optionalString(value.state) ?? "unknown",
		telemetryAvailable: optionalBoolean(value.telemetry_available),
		attributionAvailable: optionalBoolean(value.attribution_available),
		...(optionalString(value.engine) ? { engine: optionalString(value.engine) } : {}),
		...(optionalString(value.firewall) ? { firewall: optionalString(value.firewall) } : {}),
		...(optionalString(value.mechanism) ? { mechanism: optionalString(value.mechanism) } : {}),
		...(optionalString(value.evidence) ? { evidence: optionalString(value.evidence) } : {}),
		...(source
			? {
					sourceIp:
						source.ip === null ? null : optionalString(source.ip) ?? null,
				}
			: {}),
		...(destination
			? {
					destinationIp:
						destination.ip === null
							? null
							: optionalString(destination.ip) ?? null,
					...(optionalNumber(destination.port) !== undefined
						? { destinationPort: optionalNumber(destination.port) }
						: {}),
				}
			: {}),
		...(control
			? {
					controlPath: {
						...(optionalString(control.mode) ? { mode: optionalString(control.mode) } : {}),
						independentFromWanFilter: optionalBoolean(
							control.independent_from_wan_filter,
						),
						blindSpot: control.blind_spot === true,
						...(optionalString(control.detail)
							? { detail: optionalString(control.detail) }
							: {}),
					},
				}
			: {}),
	};
}

function parsePfSensePosture(homelab: Record<string, unknown>): PfSensePostureEvidence | null {
	const pfsense = isRecord(homelab.pfsense) ? homelab.pfsense : null;
	const dns = pfsense && isRecord(pfsense.dns) ? pfsense.dns : null;
	if (!dns) return null;
	const filters = Array.isArray(dns.security_filters)
		? dns.security_filters.flatMap((value) => {
				if (!isRecord(value)) return [];
				const id = optionalString(value.id);
				const label = optionalString(value.label);
				const state = optionalString(value.state);
				const detail = optionalString(value.detail);
				return id && label && state && detail ? [{ id, label, state, detail }] : [];
			})
		: [];
	return {
		configured: optionalBoolean(dns.configured),
		reachable: optionalBoolean(dns.reachable),
		policyState: healthState(dns.policy_state) ?? "unknown",
		...(optionalString(dns.reason) ? { reason: optionalString(dns.reason) } : {}),
		...(optionalString(dns.error_stage) ? { errorStage: optionalString(dns.error_stage) } : {}),
		...(optionalString(dns.error) ? { error: optionalString(dns.error) } : {}),
		securityFilters: filters,
		ingressBlock: parseIngressBlock(dns.ingress_block),
	};
}

function providerCredentials(homelab: Record<string, unknown>): ProviderCredentialEvidence[] {
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
				invalidReferenceVariables: stringArray(value.invalid_reference_variables),
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

function exposureState(
	observed: boolean | null,
	expected: boolean | null,
	trustedSourcesOnly: boolean,
): OperationalHealthState {
	if (observed === null || expected === null) return "unknown";
	if (observed !== expected) return "fail";
	return trustedSourcesOnly ? "warn" : "ok";
}

function exposurePorts(sickzValue: unknown): ExposurePortEvidence[] {
	if (!isRecord(sickzValue) || !isRecord(sickzValue.checks)) return [];
	const pfsense = Object.values(sickzValue.checks).find(
		(value) => isRecord(value) && isRecord(value.pfsense_tcp_port_policy),
	);
	if (!isRecord(pfsense)) return [];
	const policyByPort = pfsense.pfsense_tcp_port_policy;
	if (!isRecord(policyByPort)) return [];
	const observedPorts = isRecord(pfsense.pfsense_tcp_ports)
		? pfsense.pfsense_tcp_ports
		: {};
	return [7000, 10443].flatMap((port) => {
		const policy = policyByPort[String(port)];
		if (!isRecord(policy)) return [];
		const observed = optionalBoolean(observedPorts[String(port)]);
		const expected = optionalBoolean(policy.expected_reachable);
		const accessPolicy = optionalString(policy.access_policy);
		return [
			{
				port,
				service: optionalString(policy.service) ?? `TCP ${port}`,
				observedReachable: observed,
				expectedReachable: expected,
				...(accessPolicy ? { accessPolicy } : {}),
				...(optionalString(policy.default_action)
					? { defaultAction: optionalString(policy.default_action) }
					: {}),
				expectedFrom: stringArray(policy.expected_from),
				negativeProbeRequired: policy.negative_probe_required === true,
				...(optionalString(policy.reason) ? { reason: optionalString(policy.reason) } : {}),
				state: exposureState(
					observed,
					expected,
					accessPolicy === "trusted_sources_only",
				),
			},
		];
	});
}

function freshnessEvidence(homelab: Record<string, unknown>): {
	staleServices: StaleServiceEvidence[];
	dependencyCycles: DependencyCycleEvidence[];
} {
	const services = Array.isArray(homelab.services) ? homelab.services : [];
	const idToName = new Map<string, string>();
	for (const value of services) {
		if (!isRecord(value)) continue;
		const id = optionalString(value.id);
		const name = optionalString(value.name);
		if (id && name) idToName.set(id, name);
	}
	const staleServices = services.flatMap((value) => {
		if (!isRecord(value) || value.observation_stale !== true) return [];
		const id = optionalString(value.id) ?? optionalString(value.name) ?? "unknown";
		const name = optionalString(value.name) ?? id;
		return [
			{
				id,
				name,
				...(optionalNumber(value.observation_age_seconds) !== undefined
					? { observationAgeSeconds: optionalNumber(value.observation_age_seconds) }
					: {}),
			},
		];
	});

	const cycleKeys = new Set<string>();
	const dependencyCycles: DependencyCycleEvidence[] = [];
	for (const value of services) {
		if (!isRecord(value)) continue;
		const members = stringArray(value.dependency_cycle).sort();
		if (members.length < 2) continue;
		const key = members.join("\0");
		if (cycleKeys.has(key)) continue;
		cycleKeys.add(key);
		dependencyCycles.push({
			members: members.map((member) => idToName.get(member) ?? member),
		});
	}
	return { staleServices, dependencyCycles };
}

function troubleshootFocus(
	components: OperationalComponentEvidence[],
	pfsense: PfSensePostureEvidence | null,
	staleServices: StaleServiceEvidence[],
	cycles: DependencyCycleEvidence[],
	board: FastApiHealthBoardSnapshot,
): TroubleshootingFocus {
	if (pfsense?.ingressBlock?.state === "blocked") return "pfsense_block";
	if (
		pfsense?.ingressBlock?.state === "telemetry_unavailable" &&
		pfsense.ingressBlock.controlPath?.blindSpot
	) {
		return "pfsense_blind_spot";
	}
	const byId = new Map(components.map((component) => [component.id, component]));
	if (byId.get("pfsense")?.state === "fail") return "pfsense_control";
	if (byId.get("cloudflare")?.state === "fail") return "cloudflare";
	if (byId.get("truenas")?.state === "fail") return "truenas";
	if (board.state === "stale" || staleServices.length > 0) return "stale_evidence";
	if (cycles.length > 0) return "dependency_cycle";
	return "dependencies";
}

export function parseHomelabOperationalEvidence(
	board: FastApiHealthBoardSnapshot,
): HomelabOperationalEvidence {
	const homelab = isRecord(board.homelab) ? board.homelab : {};
	const rawComponents = isRecord(homelab.components) ? homelab.components : {};
	const components = (["truenas", "pfsense", "cloudflare"] as const).map((id) =>
		componentEvidence(id, rawComponents[id]),
	);
	const pfsense = parsePfSensePosture(homelab);
	const { staleServices, dependencyCycles } = freshnessEvidence(homelab);
	return {
		board: {
			state: board.state,
			refreshing: board.refreshing,
			...(typeof board.age_seconds === "number" ? { ageSeconds: board.age_seconds } : {}),
			generatedAt: board.generated_at,
			...(board.error !== undefined ? { error: board.error } : {}),
		},
		...(optionalString(homelab.components_status)
			? { componentsStatus: optionalString(homelab.components_status) }
			: {}),
		components,
		pfsense,
		exposurePorts: exposurePorts(board.sickz),
		providerCredentials: providerCredentials(homelab),
		...(optionalNumber(homelab.refresh_elapsed_ms) !== undefined
			? { refreshElapsedMs: optionalNumber(homelab.refresh_elapsed_ms) }
			: {}),
		staleServices,
		dependencyCycles,
		troubleshootingFocus: troubleshootFocus(
			components,
			pfsense,
			staleServices,
			dependencyCycles,
			board,
		),
	};
}
