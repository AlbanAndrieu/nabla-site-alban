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
	if (["healthy", "active", "up", "ok"].includes(status)) return HEALTH_COLORS.ok;
	if (["down", "inactive", "failed", "error", "degraded"].includes(status)) {
		return status === "degraded" ? HEALTH_COLORS.warn : HEALTH_COLORS.fail;
	}
	return HEALTH_COLORS.warn;
}
