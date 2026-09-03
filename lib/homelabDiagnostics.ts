export type ExposureState = "match" | "mismatch" | "incomplete" | "not_applicable";

export type HomelabExposureEvidence = {
	state: ExposureState;
	reasons: string[];
	declared: {
		external?: boolean;
		endpoint_enabled?: boolean;
		edge_mode?: "cloudflare" | "direct" | "unspecified" | string;
		cloudflare_access_required?: boolean;
		security_exception_declared?: boolean;
	};
	observed: {
		public_https_reachable?: boolean | null;
		cloudflare_tunnel_observed?: boolean;
		cloudflare_tunnel_name?: string | null;
		cloudflare_tunnel_status?: string | null;
		cloudflare_access_observed?: boolean;
		cloudflare_access_application_count?: number;
		cloudflare_access_policy_count?: number;
		cloudflare_access_policy_decisions?: string[];
		cloudflare_access_public?: boolean | null;
		cloudflare_access_public_scope?: string | null;
		cloudflare_access_public_policy_count?: number;
	};
};

export type TrueNasLastGoodDiagnostics = {
	version?: string;
	last_success_at?: string;
	app_count?: number;
	running_app_count?: number;
	non_running_app_count?: number;
};

export type TrueNasApiDiagnostics = {
	reachable: boolean;
	phase?: string;
	stage?: string;
	elapsed_ms?: number;
	error?: string;
	exception_type?: string;
	cached?: boolean;
	cache_layer?: string;
	cache_age_seconds?: number;
	stale?: boolean;
	refresh_in_progress?: boolean;
	redis_available?: boolean;
	retry_after_seconds?: number;
	last_success_at?: string;
	last_good_available?: boolean;
	last_good?: TrueNasLastGoodDiagnostics;
};

export type PfSenseIngressDiagnostics = {
	state: string;
	telemetry_available: boolean;
	attribution_available: boolean;
	evidence?: string;
	path?: string;
	cached?: boolean;
	cache_layer?: string;
	stale?: boolean;
	refresh_in_progress?: boolean;
	redis_available?: boolean;
	attempts?: number;
	elapsed_ms?: number;
	http_status?: number;
	error_kind?: string;
	failure_stage?: string;
	exception_type?: string;
	refresh_error?: string;
	cache_age_seconds?: number;
	last_success_at?: string;
	last_known_match?: boolean;
	control_path?: {
		mode?: string;
		independent_from_wan_filter?: boolean;
		blind_spot?: boolean;
		detail?: string;
	};
};

export type CloudflareDiagnostics = {
	configured?: boolean;
	tunnels_observed?: number;
	access_applications_observed?: number;
	tunnel_observer_state?: string;
	access_observer_state?: string;
	tunnel_error?: string | null;
	access_error?: string | null;
};

export type HomelabDiagnosticsSnapshot = {
	checked_at?: string;
	truenas_api?: TrueNasApiDiagnostics;
	pfsense_ingress?: PfSenseIngressDiagnostics;
	cloudflare?: CloudflareDiagnostics;
	exposure_by_service: Record<string, HomelabExposureEvidence>;
};

export const HOMELAB_DIAGNOSTICS_DEFAULT_API_URL =
	"https://fastapi-sample.fastapicloud.dev/api/homelab/health";

const PRIMARY_TIMEOUT_MS = 8_000;
const RUNNING_APP_STATES = new Set(["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

function parseExposure(value: unknown): HomelabExposureEvidence | undefined {
	if (!isRecord(value)) return undefined;
	if (!["match", "mismatch", "incomplete", "not_applicable"].includes(String(value.state))) {
		return undefined;
	}
	if (!isRecord(value.declared) || !isRecord(value.observed)) return undefined;
	return {
		state: value.state as ExposureState,
		reasons: stringArray(value.reasons),
		declared: {
			external: optionalBoolean(value.declared.external),
			endpoint_enabled: optionalBoolean(value.declared.endpoint_enabled),
			edge_mode: optionalString(value.declared.edge_mode),
			cloudflare_access_required: optionalBoolean(
				value.declared.cloudflare_access_required,
			),
			security_exception_declared: optionalBoolean(
				value.declared.security_exception_declared,
			),
		},
		observed: {
			public_https_reachable:
				value.observed.public_https_reachable === null
					? null
					: optionalBoolean(value.observed.public_https_reachable),
			cloudflare_tunnel_observed: optionalBoolean(
				value.observed.cloudflare_tunnel_observed,
			),
			cloudflare_tunnel_name:
				value.observed.cloudflare_tunnel_name === null
					? null
					: optionalString(value.observed.cloudflare_tunnel_name),
			cloudflare_tunnel_status:
				value.observed.cloudflare_tunnel_status === null
					? null
					: optionalString(value.observed.cloudflare_tunnel_status),
			cloudflare_access_observed: optionalBoolean(
				value.observed.cloudflare_access_observed,
			),
			cloudflare_access_application_count: optionalNumber(
				value.observed.cloudflare_access_application_count,
			),
			cloudflare_access_policy_count: optionalNumber(
				value.observed.cloudflare_access_policy_count,
			),
			cloudflare_access_policy_decisions: stringArray(
				value.observed.cloudflare_access_policy_decisions,
			),
			cloudflare_access_public:
				value.observed.cloudflare_access_public === null
					? null
					: optionalBoolean(value.observed.cloudflare_access_public),
			cloudflare_access_public_scope:
				value.observed.cloudflare_access_public_scope === null
					? null
					: optionalString(value.observed.cloudflare_access_public_scope),
			cloudflare_access_public_policy_count: optionalNumber(
				value.observed.cloudflare_access_public_policy_count,
			),
		},
	};
}

function parseTrueNasLastGood(value: unknown): TrueNasLastGoodDiagnostics | undefined {
	if (!isRecord(value)) return undefined;
	const apps = Array.isArray(value.apps)
		? value.apps.filter((app): app is Record<string, unknown> => isRecord(app))
		: [];
	const running = apps.filter((app) =>
		RUNNING_APP_STATES.has(String(app.state ?? "").trim().toUpperCase()),
	).length;
	return {
		version: optionalString(value.version),
		last_success_at: optionalString(value.last_success_at),
		app_count: apps.length,
		running_app_count: running,
		non_running_app_count: apps.length - running,
	};
}

function parseTrueNasApi(value: unknown): TrueNasApiDiagnostics | undefined {
	if (!isRecord(value) || typeof value.reachable !== "boolean") return undefined;
	const lastGood = parseTrueNasLastGood(value.last_good);
	return {
		reachable: value.reachable,
		phase: optionalString(value.phase),
		stage: optionalString(value.stage),
		elapsed_ms: optionalNumber(value.elapsed_ms),
		error: optionalString(value.error),
		exception_type: optionalString(value.exception_type),
		cached: optionalBoolean(value.cached),
		cache_layer: optionalString(value.cache_layer),
		cache_age_seconds: optionalNumber(value.cache_age_seconds),
		stale: optionalBoolean(value.stale),
		refresh_in_progress: optionalBoolean(value.refresh_in_progress),
		redis_available: optionalBoolean(value.redis_available),
		retry_after_seconds: optionalNumber(value.retry_after_seconds),
		last_success_at: optionalString(value.last_success_at),
		last_good_available: lastGood !== undefined,
		last_good: lastGood,
	};
}

function parsePfSenseIngress(value: unknown): PfSenseIngressDiagnostics | undefined {
	if (
		!isRecord(value) ||
		typeof value.state !== "string" ||
		typeof value.telemetry_available !== "boolean" ||
		typeof value.attribution_available !== "boolean"
	) {
		return undefined;
	}
	const controlPath = isRecord(value.control_path)
		? {
				mode: optionalString(value.control_path.mode),
				independent_from_wan_filter: optionalBoolean(
					value.control_path.independent_from_wan_filter,
				),
				blind_spot: optionalBoolean(value.control_path.blind_spot),
				detail: optionalString(value.control_path.detail),
			}
		: undefined;
	return {
		state: value.state,
		telemetry_available: value.telemetry_available,
		attribution_available: value.attribution_available,
		evidence: optionalString(value.evidence),
		path: optionalString(value.path),
		cached: optionalBoolean(value.cached),
		cache_layer: optionalString(value.cache_layer),
		stale: optionalBoolean(value.stale),
		refresh_in_progress: optionalBoolean(value.refresh_in_progress),
		redis_available: optionalBoolean(value.redis_available),
		attempts: optionalNumber(value.attempts),
		elapsed_ms: optionalNumber(value.elapsed_ms),
		http_status: optionalNumber(value.http_status),
		error_kind: optionalString(value.error_kind),
		failure_stage: optionalString(value.failure_stage),
		exception_type: optionalString(value.exception_type),
		refresh_error: optionalString(value.refresh_error),
		cache_age_seconds: optionalNumber(value.cache_age_seconds),
		last_success_at: optionalString(value.last_success_at),
		last_known_match: optionalBoolean(value.last_known_match),
		control_path: controlPath,
	};
}

function parseCloudflare(value: unknown): CloudflareDiagnostics | undefined {
	if (!isRecord(value)) return undefined;
	return {
		configured: optionalBoolean(value.configured),
		tunnels_observed: optionalNumber(value.tunnels_observed),
		access_applications_observed: optionalNumber(
			value.access_applications_observed,
		),
		tunnel_observer_state: optionalString(value.tunnel_observer_state),
		access_observer_state: optionalString(value.access_observer_state),
		tunnel_error:
			value.tunnel_error === null ? null : optionalString(value.tunnel_error),
		access_error:
			value.access_error === null ? null : optionalString(value.access_error),
	};
}

export function parseHomelabDiagnostics(
	value: unknown,
): HomelabDiagnosticsSnapshot | null {
	if (!isRecord(value)) return null;
	const exposures: Record<string, HomelabExposureEvidence> = {};
	if (Array.isArray(value.services)) {
		for (const service of value.services) {
			if (!isRecord(service) || typeof service.id !== "string") continue;
			const exposure = parseExposure(service.exposure);
			if (exposure) exposures[service.id] = exposure;
		}
	}
	const truenas = isRecord(value.truenas) ? value.truenas : undefined;
	const pfsense = isRecord(value.pfsense) ? value.pfsense : undefined;
	const dns = pfsense && isRecord(pfsense.dns) ? pfsense.dns : undefined;
	return {
		checked_at: optionalString(value.checked_at),
		truenas_api: parseTrueNasApi(truenas?.api),
		pfsense_ingress: parsePfSenseIngress(dns?.ingress_block),
		cloudflare: parseCloudflare(value.cloudflare),
		exposure_by_service: exposures,
	};
}

export async function loadHomelabDiagnostics(): Promise<HomelabDiagnosticsSnapshot | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);
	try {
		const response = await fetch(
			process.env.HOMELAB_HEALTH_API_URL?.trim() ||
				HOMELAB_DIAGNOSTICS_DEFAULT_API_URL,
			{
				headers: { Accept: "application/json" },
				cache: "no-store",
				signal: controller.signal,
			},
		);
		if (!response.ok) return null;
		return parseHomelabDiagnostics(await response.json());
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
