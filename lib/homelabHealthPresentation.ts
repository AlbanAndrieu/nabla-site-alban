import type { HomelabHealthEntry, HomelabHealthState } from "./homelabHealth";

export type HomelabPresentationState = HomelabHealthState | "pending";

const HEALTH_COLORS: Record<HomelabPresentationState, string> = {
	pending: "#38bdf8",
	ok: "#22c55e",
	warn: "#f59e0b",
	fail: "#ef4444",
	unknown: "#94a3b8",
};

export function homelabHealthColor(state: HomelabPresentationState): string {
	return HEALTH_COLORS[state];
}

export function isHttpsEndpoint(url?: string): boolean {
	if (!url) return false;
	try {
		return new URL(url).protocol === "https:";
	} catch {
		return false;
	}
}

export function tlsIndicatorColor(trusted: boolean | null | undefined): string {
	if (trusted === true) return HEALTH_COLORS.ok;
	if (trusted === false) return HEALTH_COLORS.fail;
	return HEALTH_COLORS.unknown;
}

export function hasCloudflareEvidence(entry?: HomelabHealthEntry): boolean {
	return Boolean(entry?.tunnel_status?.trim() || entry?.tunnel_name?.trim());
}

export function cloudflareIndicatorColor(entry?: HomelabHealthEntry): string {
	const status = entry?.tunnel_status?.trim().toLowerCase();
	if (!status) return HEALTH_COLORS.unknown;
	if (["healthy", "active", "up", "ok"].includes(status))
		return HEALTH_COLORS.ok;
	if (["down", "inactive", "failed", "error", "degraded"].includes(status)) {
		return status === "degraded" ? HEALTH_COLORS.warn : HEALTH_COLORS.fail;
	}
	return HEALTH_COLORS.warn;
}


export type HomelabHealthReasonKind =
	| "runtime_down"
	| "public_endpoint_down"
	| "internal_endpoint_down"
	| "application_error"
	| "tunnel_missing"
	| "tunnel_down"
	| "tunnel_unobserved"
	| "runtime_stale"
	| "tunnel_stale"
	| "stale_evidence";

export type HomelabHealthReason = {
	kind: HomelabHealthReasonKind;
	detail?: string;
};

export type HomelabHealthReasonOptions = {
	tunnelExpected?: boolean;
	cloudflareConfigured?: boolean;
	runtimeStale?: boolean;
};

const FAILED_RUNTIME_STATES = new Set([
	"crashed",
	"down",
	"error",
	"failed",
	"stopped",
]);
const FAILED_TUNNEL_STATES = new Set([
	"down",
	"inactive",
	"failed",
	"error",
]);

export function homelabHealthReasons(
	entry: HomelabHealthEntry | undefined,
	options: HomelabHealthReasonOptions = {},
): HomelabHealthReason[] {
	if (!entry) return [];
	const reasons: HomelabHealthReason[] = [];
	const runtimeState = entry.runtime_state?.trim().toLowerCase();
	const runtimeStale = options.runtimeStale === true || entry.runtime_stale === true;
	const tunnelStatus = entry.tunnel_status?.trim().toLowerCase();

	if (runtimeStale) {
		reasons.push({ kind: "runtime_stale" });
	} else if (runtimeState && FAILED_RUNTIME_STATES.has(runtimeState)) {
		reasons.push({
			kind: "runtime_down",
			detail: entry.runtime_state ?? runtimeState,
		});
	}

	if (entry.application_error) {
		reasons.push({
			kind: "application_error",
			detail: entry.application_error,
		});
	}

	if (entry.direct_state === "fail") {
		reasons.push({
			kind: "public_endpoint_down",
			detail:
				entry.error?.trim() ||
				(entry.http_status > 0 ? `HTTP ${entry.http_status}` : "unreachable"),
		});
	}

	if (entry.internal_state === "fail") {
		reasons.push({
			kind: "internal_endpoint_down",
			detail: "internal probe failed",
		});
	}

	if (options.tunnelExpected === true) {
		if (entry.tunnel_stale === true) {
			reasons.push({ kind: "tunnel_stale" });
		} else if (options.cloudflareConfigured === false) {
			reasons.push({ kind: "tunnel_unobserved" });
		} else if (!tunnelStatus) {
			reasons.push({ kind: "tunnel_missing" });
		} else if (FAILED_TUNNEL_STATES.has(tunnelStatus)) {
			reasons.push({
				kind: "tunnel_down",
				detail: entry.tunnel_status ?? tunnelStatus,
			});
		}
	}

	if (entry.observation_stale === true) {
		reasons.push({ kind: "stale_evidence" });
	}

	return reasons;
}
