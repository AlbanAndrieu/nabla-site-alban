import type { HomelabHealthEntry, HomelabHealthState } from "./homelabHealth";

export type HomelabHealthEvidence = {
	kind: "application" | "http" | "runtime" | "internal" | "cloudflare";
	state: HomelabHealthState;
	label: string;
};

export type HomelabHealthPolicy = {
	external?: boolean;
	tunnelExpected?: boolean;
};

export type HomelabHealthReconciliation = {
	state: HomelabHealthState;
	reason:
		| "application_error"
		| "http_failure"
		| "runtime_failure"
		| "cloudflare_failure"
		| "degraded_evidence"
		| "healthy_evidence"
		| "insufficient_evidence";
	evidence: HomelabHealthEvidence[];
};

const HEALTHY_TUNNEL_STATES = new Set(["healthy", "active", "up", "ok"]);
const DEGRADED_TUNNEL_STATES = new Set(["degraded", "starting", "unknown"]);
const FAILED_TUNNEL_STATES = new Set(["down", "inactive", "failed", "error"]);

function normalizeRuntimeState(value?: string | null): HomelabHealthState | null {
	const normalized = value?.trim().toLowerCase();
	if (!normalized) return null;
	if (["running", "active", "healthy", "up", "started"].includes(normalized)) return "ok";
	if (
		["deploying", "stopping", "stopped", "failed", "error", "crashed", "down"].includes(
			normalized,
		)
	) {
		return "fail";
	}
	if (["starting", "degraded", "warning", "paused"].includes(normalized)) return "warn";
	return "unknown";
}

function normalizeTunnelState(value?: string | null): HomelabHealthState | null {
	const normalized = value?.trim().toLowerCase();
	if (!normalized) return null;
	if (HEALTHY_TUNNEL_STATES.has(normalized)) return "ok";
	if (DEGRADED_TUNNEL_STATES.has(normalized)) return "warn";
	if (FAILED_TUNNEL_STATES.has(normalized)) return "fail";
	return "unknown";
}

function addEvidence(
	evidence: HomelabHealthEvidence[],
	kind: HomelabHealthEvidence["kind"],
	state: HomelabHealthState | null | undefined,
	label: string,
) {
	if (!state) return;
	evidence.push({ kind, state, label });
}

export function reconcileHomelabHealth(
	entry: HomelabHealthEntry,
	policy: HomelabHealthPolicy = {},
): HomelabHealthReconciliation {
	const evidence: HomelabHealthEvidence[] = [];
	const tunnelExpected = policy.tunnelExpected ?? true;

	if (entry.application_error) {
		addEvidence(evidence, "application", "warn", entry.application_error);
		return { state: "warn", reason: "application_error", evidence };
	}

	if (entry.direct_state) {
		addEvidence(evidence, "http", entry.direct_state, `direct ${entry.direct_state}`);
	} else if (entry.http_status > 0) {
		const httpState: HomelabHealthState =
			entry.http_status >= 200 && entry.http_status <= 399
				? "ok"
				: [401, 403, 407, 429].includes(entry.http_status)
					? "warn"
					: "fail";
		addEvidence(evidence, "http", httpState, `HTTP ${entry.http_status}`);
	}

	const runtimeState =
		entry.runtime_stale === true || entry.runtime_reachable === false
			? null
			: normalizeRuntimeState(entry.runtime_state);
	if (runtimeState) {
		addEvidence(
			evidence,
			"runtime",
			runtimeState,
			`TrueNAS ${entry.runtime_state}${entry.runtime_app ? ` (${entry.runtime_app})` : ""}`,
		);
	}

	if (entry.internal_state) {
		addEvidence(evidence, "internal", entry.internal_state, `internal ${entry.internal_state}`);
	}

	const tunnelState =
		tunnelExpected && entry.tunnel_stale !== true
			? normalizeTunnelState(entry.tunnel_status)
			: null;
	if (tunnelState) {
		addEvidence(
			evidence,
			"cloudflare",
			tunnelState,
			`Cloudflare ${entry.tunnel_status}${entry.tunnel_name ? ` (${entry.tunnel_name})` : ""}`,
		);
	}

	const byKind = new Map(evidence.map((item) => [item.kind, item.state]));
	const http = byKind.get("http");
	const runtime = byKind.get("runtime");
	const internal = byKind.get("internal");
	const cloudflare = byKind.get("cloudflare");
	const originProvenUp =
		internal === "ok" || (entry.http_status >= 200 && entry.http_status < 300);

	if (runtime === "fail") {
		return originProvenUp
			? { state: "warn", reason: "degraded_evidence", evidence }
			: { state: "fail", reason: "runtime_failure", evidence };
	}

	if (http === "ok") {
		if (cloudflare === "fail") {
			return internal === "ok" || runtime === "ok"
				? { state: "warn", reason: "degraded_evidence", evidence }
				: { state: "fail", reason: "cloudflare_failure", evidence };
		}
		return internal === "fail"
			? { state: "warn", reason: "degraded_evidence", evidence }
			: { state: "ok", reason: "healthy_evidence", evidence };
	}

	if (http === "warn") {
		if (cloudflare === "fail") {
			return internal === "ok" || runtime === "ok"
				? { state: "warn", reason: "degraded_evidence", evidence }
				: { state: "fail", reason: "cloudflare_failure", evidence };
		}
		return { state: "warn", reason: "degraded_evidence", evidence };
	}

	if (http === "fail") {
		return internal === "ok" || runtime === "ok"
			? { state: "warn", reason: "degraded_evidence", evidence }
			: { state: "fail", reason: "http_failure", evidence };
	}

	if (internal === "ok") return { state: "ok", reason: "healthy_evidence", evidence };
	if (internal === "fail") {
		return runtime === "ok"
			? { state: "warn", reason: "degraded_evidence", evidence }
			: { state: "fail", reason: "http_failure", evidence };
	}
	if (runtime === "ok") return { state: "warn", reason: "degraded_evidence", evidence };
	if (tunnelExpected && cloudflare) {
		return { state: "warn", reason: "degraded_evidence", evidence };
	}
	if (evidence.length > 0) {
		return { state: "warn", reason: "degraded_evidence", evidence };
	}

	return {
		state: entry.state === "unknown" ? "unknown" : entry.state,
		reason: "insufficient_evidence",
		evidence,
	};
}
