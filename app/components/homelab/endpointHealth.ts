import type { HomelabHealthEntry } from "@/lib/homelabHealth";
import type { EndpointHealthState } from "./homelabGridPresentation";

type HealthState = EndpointHealthState;
export type TunnelIndicatorState =
	| "healthy"
	| "missing"
	| "degraded"
	| "unknown";

export type ProbeDetail =
	| { kind: "checking" }
	| { kind: "notConfigured" }
	| { kind: "invalidUrl" }
	| { kind: "protocol"; protocol: string }
	| { kind: "http"; status: number }
	| { kind: "timeout" }
	| { kind: "favicon" }
	| { kind: "unreadable" };

export function classifyHttpStatus(status: number): HealthState {
	if (status >= 200 && status <= 399) return "ok";
	if ([401, 403, 407, 429].includes(status)) return "warn";
	return "fail";
}

export function snapshotHealth(entry: HomelabHealthEntry): HealthState {
	if (entry.application_error) return "fail";
	return entry.state;
}

export function hasAuthoritativeEvidence(entry?: HomelabHealthEntry): boolean {
	if (!entry) return false;
	return Boolean(
		entry.application_error ||
			entry.direct_state != null ||
			entry.internal_state != null ||
			entry.runtime_state != null ||
			entry.tunnel_status?.trim() ||
			entry.http_status > 0 ||
			entry.state !== "unknown",
	);
}

export function tunnelIndicatorState(
	tunnelSecure: boolean,
	entry?: HomelabHealthEntry,
): TunnelIndicatorState {
	if (!tunnelSecure || !entry) return "unknown";
	const normalized = entry.tunnel_status?.trim().toLowerCase();
	if (!normalized) return "missing";
	if (["healthy", "active", "up", "ok"].includes(normalized)) return "healthy";
	return "degraded";
}

export function snapshotAgeSeconds(
	checkedAt?: string,
	now: number = Date.now(),
): number | null {
	if (!checkedAt) return null;
	const timestamp = Date.parse(checkedAt);
	if (!Number.isFinite(timestamp)) return null;
	return Math.max(0, Math.round((now - timestamp) / 1000));
}

/** Observed evidence fragments shown under the endpoint link. */
export function endpointEvidenceItems(
	initialHealth: HomelabHealthEntry | undefined,
	showCloudflare: boolean,
): string[] {
	return [
		typeof initialHealth?.http_status === "number" &&
		initialHealth.http_status > 0
			? `HTTP ${initialHealth.http_status}`
			: null,
		initialHealth?.direct_state ? `direct ${initialHealth.direct_state}` : null,
		initialHealth?.runtime_state
			? `TrueNAS ${initialHealth.runtime_state}`
			: null,
		initialHealth?.internal_state
			? `internal ${initialHealth.internal_state}`
			: null,
		showCloudflare && initialHealth?.tunnel_status
			? `Cloudflare ${initialHealth.tunnel_status}`
			: null,
	].filter((item): item is string => Boolean(item));
}
