import type { HomelabHealthEntry, HomelabHealthState } from "./homelabHealth";

export type HomelabHealthEvidence = {
	kind: "application" | "http" | "runtime" | "internal" | "cloudflare";
	state: HomelabHealthState;
	label: string;
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
	if (["deploying", "starting", "degraded", "warning", "paused"].includes(normalized)) return "warn";
	if (["stopped", "failed", "error", "crashed", "down"].includes(normalized)) return "fail";
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

export function reconcileHomelabHealth(entry: HomelabHealthEntry): HomelabHealthReconciliation {
	const evidence: HomelabHealthEvidence[] = [];

	if (entry.application_error) {
		addEvidence(evidence, "application", "fail", entry.application_error);
		return { state: "fail", reason: "application_error", evidence };
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

	const runtimeState = normalizeRuntimeState(entry.runtime_state);
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

	const tunnelState = normalizeTunnelState(entry.tunnel_status);
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

	if (http === "fail") {
		return { state: "fail", reason: "http_failure", evidence };
	}

	if (runtime === "fail" && http !== "ok") {
		return { state: "fail", reason: "runtime_failure", evidence };
	}

	if (cloudflare === "fail" && http !== "ok") {
		return { state: "fail", reason: "cloudflare_failure", evidence };
	}

	if ([http, runtime, internal, cloudflare].includes("warn")) {
		return { state: "warn", reason: "degraded_evidence", evidence };
	}

	if (
		(http === "ok" && (runtime === "fail" || cloudflare === "fail")) ||
		(runtime === "ok" && internal === "fail")
	) {
		return { state: "warn", reason: "degraded_evidence", evidence };
	}

	if ([http, runtime, internal, cloudflare].some((state) => state === "ok")) {
		return { state: "ok", reason: "healthy_evidence", evidence };
	}

	return {
		state: entry.state === "unknown" ? "unknown" : entry.state,
		reason: "insufficient_evidence",
		evidence,
	};
}
