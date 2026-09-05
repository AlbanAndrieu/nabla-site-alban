import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";
import {
	parseHomelabDiagnostics,
	type HomelabDiagnosticsSnapshot,
} from "./homelabDiagnostics";
import {
	parseHomelabHealthSnapshot,
	type HomelabHealthSnapshot,
} from "./homelabHealth";
import {
	parseHomelabOperationalEvidence,
	type HomelabOperationalEvidence,
	type OperationalComponentEvidence,
	type OperationalHealthState,
} from "./homelabOperationalEvidence";
import {
	parseRuntimeTopology,
	type RuntimeTopologySnapshot,
} from "./runtimeTopology";

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

export type HomelabObservabilitySource = "health-board" | "fallback" | "unavailable";

export type HomelabObservabilitySnapshot = HomelabOperationalEvidence & {
	healthSnapshot: HomelabHealthSnapshot | null;
	runtimeTopology: RuntimeTopologySnapshot | null;
	deepDiagnostics: DeepDiagnosticEvidence;
	diagnostics: HomelabDiagnosticsSnapshot | null;
	cloudflareCache: CloudflareCacheEvidence | null;
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

const REQUIRED_CHECKS = new Set(["postgres", "redis", "supabase"]);
const CONTROL_PLANE_CHECKS = new Set(["cloudflare", "pfsense"]);
const INTEGRATION_CHECKS = new Set([
	"openstack_me",
	"tavily",
	"brave",
	"google",
	"appwrite",
	"keycloak",
	"unleash",
	"sentry",
	"datadog",
	"pyroscope",
	"litellm",
]);

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

function optionalBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}

function nullableBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function categoryFor(id: string): DeepDiagnosticCategory {
	if (REQUIRED_CHECKS.has(id)) return "required";
	if (CONTROL_PLANE_CHECKS.has(id)) return "control-plane";
	if (INTEGRATION_CHECKS.has(id)) return "integration";
	return "homelab";
}

function stateForCheck(
	id: string,
	raw: Record<string, unknown>,
): OperationalHealthState {
	if (raw.stale === true || raw.degraded === true || raw.tls_trusted === false) {
		return "warn";
	}
	if (raw.skipped === true || raw.reachable === null || raw.reachable === undefined) {
		return "unknown";
	}
	if (raw.reachable === true) return "ok";
	if (raw.reachable === false) return REQUIRED_CHECKS.has(id) ? "fail" : "warn";
	return "unknown";
}

function parseCache(value: unknown): ProbeCacheEvidence | undefined {
	if (!isRecord(value)) return undefined;
	const cache: ProbeCacheEvidence = {
		...(optionalString(value.cache_layer) ? { layer: optionalString(value.cache_layer) } : {}),
		...(optionalBoolean(value.cached) !== undefined ? { cached: optionalBoolean(value.cached) } : {}),
		...(optionalBoolean(value.stale) !== undefined ? { stale: optionalBoolean(value.stale) } : {}),
		...(optionalBoolean(value.refresh_in_progress) !== undefined
			? { refreshInProgress: optionalBoolean(value.refresh_in_progress) }
			: {}),
		...(optionalBoolean(value.redis_available) !== undefined
			? { redisAvailable: optionalBoolean(value.redis_available) }
			: {}),
		...(optionalNumber(value.cache_age_seconds) !== undefined
			? { ageSeconds: optionalNumber(value.cache_age_seconds) }
			: {}),
	};
	return Object.keys(cache).length ? cache : undefined;
}

function parseDeepDiagnostics(value: unknown): DeepDiagnosticEvidence {
	if (!isRecord(value)) return { checks: [] };
	const rawChecks = isRecord(value.checks) ? value.checks : {};
	const checks = Object.entries(rawChecks).flatMap(([id, checkValue]) => {
		if (!isRecord(checkValue)) return [];
		const displayLabel = optionalString(checkValue.display_label) ?? optionalString(checkValue.name);
		const cache = parseCache(checkValue);
		return [
			{
				id,
				label: displayLabel ?? id,
				category: categoryFor(id),
				state: stateForCheck(id, checkValue),
				reachable: nullableBoolean(checkValue.reachable),
				skipped: checkValue.skipped === true,
				...(optionalString(checkValue.reason) ? { reason: optionalString(checkValue.reason) } : {}),
				...(optionalString(checkValue.error) ? { error: optionalString(checkValue.error) } : {}),
				...(optionalString(checkValue.error_kind)
					? { errorKind: optionalString(checkValue.error_kind) }
					: {}),
				...(optionalString(checkValue.exception_type)
					? { exceptionType: optionalString(checkValue.exception_type) }
					: {}),
				...(optionalNumber(checkValue.elapsed_ms) !== undefined
					? { elapsedMs: optionalNumber(checkValue.elapsed_ms) }
					: {}),
				...(optionalNumber(checkValue.http_status) !== undefined
					? { httpStatus: optionalNumber(checkValue.http_status) }
					: {}),
				...(checkValue.tls_trusted === null || typeof checkValue.tls_trusted === "boolean"
					? { tlsTrusted: checkValue.tls_trusted as boolean | null }
					: {}),
				...(optionalString(checkValue.probe) ? { probe: optionalString(checkValue.probe) } : {}),
				...(optionalString(checkValue.authentication)
					? { authentication: optionalString(checkValue.authentication) }
					: {}),
				...(optionalString(checkValue.resource)
					? { resource: optionalString(checkValue.resource) }
					: {}),
				...(optionalString(checkValue.path) ? { path: optionalString(checkValue.path) } : {}),
				...(optionalString(checkValue.target) ? { target: optionalString(checkValue.target) } : {}),
				...(optionalBoolean(checkValue.degraded) !== undefined
					? { degraded: optionalBoolean(checkValue.degraded) }
					: {}),
				...(cache ? { cache } : {}),
			} satisfies DeepDiagnosticCheckEvidence,
		];
	});

	return {
		...(optionalString(value.contract) ? { contract: optionalString(value.contract) } : {}),
		...(optionalString(value.status) ? { status: optionalString(value.status) } : {}),
		...(optionalString(value.version) ? { version: optionalString(value.version) } : {}),
		checks,
	};
}

function parseEdgeEvidenceSkips(sickzValue: unknown): EdgeEvidenceSkip[] {
	if (!isRecord(sickzValue) || !isRecord(sickzValue.checks)) return [];
	return Object.entries(sickzValue.checks).flatMap(([id, value]) => {
		if (!isRecord(value) || value.http_evidence_skipped !== true) return [];
		const reason = optionalString(value.http_evidence_skip_reason);
		return reason ? [{ id, reason }] : [];
	});
}

function parsePfSenseIngressPolicy(healthzValue: unknown): PfSenseIngressPolicyEvidence | null {
	if (!isRecord(healthzValue) || !isRecord(healthzValue.checks)) return null;
	const pfsense = healthzValue.checks.pfsense;
	if (!isRecord(pfsense) || !isRecord(pfsense.ingress_policy)) return null;
	const policy = pfsense.ingress_policy;
	const state = optionalString(policy.state);
	if (!state) return null;
	return {
		state,
		...(optionalString(policy.access_policy)
			? { accessPolicy: optionalString(policy.access_policy) }
			: {}),
		activeEgressIps: Array.isArray(policy.active_egress_ips)
			? policy.active_egress_ips.filter(
					(value): value is string => typeof value === "string" && Boolean(value.trim()),
				)
			: [],
		possibleCauses: Array.isArray(policy.possible_causes)
			? policy.possible_causes.filter(
					(value): value is string => typeof value === "string" && Boolean(value.trim()),
				)
			: [],
		attributionAvailable:
			typeof policy.attribution_available === "boolean"
				? policy.attribution_available
				: null,
		...(optionalString(policy.detail) ? { detail: optionalString(policy.detail) } : {}),
		...(optionalString(policy.recommended_control_path)
			? { recommendedControlPath: optionalString(policy.recommended_control_path) }
			: {}),
	};
}

function parseCloudflareCache(homelabValue: unknown): CloudflareCacheEvidence | null {
	if (!isRecord(homelabValue) || !isRecord(homelabValue.cloudflare)) return null;
	const raw = homelabValue.cloudflare;
	const nestedCache = parseCache(raw.cache);
	return {
		stale: raw.stale === true || nestedCache?.stale === true,
		...(optionalString(raw.refresh_error)
			? { refreshError: optionalString(raw.refresh_error) }
			: {}),
		...(nestedCache ? { cache: nestedCache } : {}),
	};
}

function parseControlPlaneDiagnostics(
	homelabValue: unknown,
): HomelabObservabilitySnapshot["controlPlaneDiagnostics"] {
	if (!isRecord(homelabValue) || !isRecord(homelabValue.components)) return {};
	const result: HomelabObservabilitySnapshot["controlPlaneDiagnostics"] = {};
	for (const id of ["truenas", "pfsense", "cloudflare"] as const) {
		const raw = homelabValue.components[id];
		if (!isRecord(raw)) continue;
		const cache = parseCache(raw);
		result[id] = {
			...(cache ? { cache } : {}),
			...(optionalString(raw.exception_type)
				? { exceptionType: optionalString(raw.exception_type) }
				: {}),
			...(optionalString(raw.probe) ? { probe: optionalString(raw.probe) } : {}),
			...(optionalString(raw.path) ? { path: optionalString(raw.path) } : {}),
			...(optionalNumber(raw.retry_after_seconds) !== undefined
				? { retryAfterSeconds: optionalNumber(raw.retry_after_seconds) }
				: {}),
			...(optionalBoolean(raw.verify_ssl) !== undefined
				? { verifySsl: optionalBoolean(raw.verify_ssl) }
				: {}),
		};
	}
	return result;
}

export function parseHomelabObservability(
	board: FastApiHealthBoardSnapshot,
): HomelabObservabilitySnapshot {
	const operational = parseHomelabOperationalEvidence(board);
	const healthSnapshot = parseHomelabHealthSnapshot(board.homelab);
	const runtimeTopology = parseRuntimeTopology(board.runtime);
	const diagnostics = isRecord(board.homelab)
		? parseHomelabDiagnostics(board.homelab)
		: null;
	return {
		...operational,
		healthSnapshot,
		runtimeTopology,
		deepDiagnostics: parseDeepDiagnostics(board.healthz),
		diagnostics,
		cloudflareCache: parseCloudflareCache(board.homelab),
		pfsenseIngressPolicy: parsePfSenseIngressPolicy(board.healthz),
		edgeEvidenceSkips: parseEdgeEvidenceSkips(board.sickz),
		controlPlaneDiagnostics: parseControlPlaneDiagnostics(board.homelab),
		sources: {
			board: "health-board",
			runtime: runtimeTopology ? "health-board" : "unavailable",
			diagnostics: diagnostics ? "health-board" : "unavailable",
		},
	};
}

export function withObservabilityFallbacks(
	snapshot: HomelabObservabilitySnapshot,
	fallbacks: {
		runtimeTopology?: RuntimeTopologySnapshot | null;
		diagnostics?: HomelabDiagnosticsSnapshot | null;
	},
): HomelabObservabilitySnapshot {
	const runtimeTopology = snapshot.runtimeTopology ?? fallbacks.runtimeTopology ?? null;
	const diagnostics = snapshot.diagnostics ?? fallbacks.diagnostics ?? null;
	return {
		...snapshot,
		runtimeTopology,
		diagnostics,
		sources: {
			...snapshot.sources,
			runtime: snapshot.runtimeTopology
				? "health-board"
				: runtimeTopology
					? "fallback"
					: "unavailable",
			diagnostics: snapshot.diagnostics
				? "health-board"
				: diagnostics
					? "fallback"
					: "unavailable",
		},
	};
}