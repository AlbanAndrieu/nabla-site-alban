import type {
	HomelabHealthEntry,
	HomelabHealthState,
} from "./homelabHealth";

export type HomelabServiceSignalId =
	| "public"
	| "internal"
	| "runtime"
	| "dependencies"
	| "cloudflare"
	| "tls"
	| "probe";

export type HomelabServiceSignal = {
	id: HomelabServiceSignalId;
	state: HomelabHealthState;
	detail: string;
};

function runtimeState(entry: HomelabHealthEntry): HomelabHealthState {
	if (entry.runtime_stale === true || entry.runtime_reachable === false) return "unknown";
	const state = entry.runtime_state?.trim().toUpperCase();
	if (!state) return entry.runtime_reachable === true ? "ok" : "unknown";
	if (["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"].includes(state)) return "ok";
	if (["CRASHED", "DOWN", "ERROR", "FAILED", "STOPPED", "STOPPING"].includes(state)) {
		return "fail";
	}
	return "warn";
}

function cloudflareState(entry: HomelabHealthEntry): HomelabHealthState {
	if (entry.cloudflare_status_confirmed === false) return "unknown";
	const status = entry.tunnel_status?.trim().toLowerCase();
	if (!status) return entry.cloudflare_status_confirmed === true ? "ok" : "unknown";
	if (["healthy", "active", "up", "ok"].includes(status)) return "ok";
	if (["degraded", "warning", "warn"].includes(status)) return "warn";
	if (["down", "failed", "fail", "inactive", "error"].includes(status)) return "fail";
	return "unknown";
}

function dependencyState(entry: HomelabHealthEntry): HomelabHealthState {
	if ((entry.blocked_by?.length ?? 0) > 0) return "fail";
	if ((entry.degraded_by?.length ?? 0) > 0) return "warn";
	if ((entry.unconfirmed_dependencies?.length ?? 0) > 0) return "unknown";
	return entry.dependency_state ??
		(entry.required_dependencies?.length ? "unknown" : "ok");
}

function probeState(entry: HomelabHealthEntry): HomelabHealthState {
	if (entry.timed_out === true || entry.probe_source === "deadline") return "warn";
	if (entry.probe_stale === true || entry.observation_stale === true) return "warn";
	if (entry.probe_source === "origin") return "ok";
	if (entry.probe_source === "memory") return "warn";
	return "unknown";
}

function listDetail(prefix: string, values: string[] | undefined): string | null {
	return values?.length ? `${prefix}: ${values.join(", ")}` : null;
}

export function homelabServiceSignals(
	entry: HomelabHealthEntry | undefined,
): HomelabServiceSignal[] {
	if (!entry) return [];
	const signals: HomelabServiceSignal[] = [];
	const publicState = entry.direct_state ?? entry.local_state ?? entry.state;
	signals.push({
		id: "public",
		state: publicState,
		detail: [
			`public ${publicState}`,
			typeof entry.http_status === "number" ? `HTTP ${entry.http_status}` : null,
			typeof entry.latency_ms === "number" ? `${entry.latency_ms} ms` : null,
		].filter(Boolean).join(" · "),
	});

	if (entry.internal_state !== undefined && entry.internal_state !== null) {
		signals.push({
			id: "internal",
			state: entry.internal_state,
			detail: `LAN ${entry.internal_state}`,
		});
	}

	if (
		entry.runtime_state != null ||
		entry.runtime_reachable !== undefined ||
		entry.runtime_app != null
	) {
		const state = runtimeState(entry);
		signals.push({
			id: "runtime",
			state,
			detail: [
				`runtime ${entry.runtime_state ?? state}`,
				entry.runtime_stale === true ? "stale" : null,
				entry.runtime_missing === true ? "missing inventory" : null,
			].filter(Boolean).join(" · "),
		});
	}

	if (
		(entry.required_dependencies?.length ?? 0) > 0 ||
		entry.dependency_state != null ||
		(entry.blocked_by?.length ?? 0) > 0 ||
		(entry.degraded_by?.length ?? 0) > 0 ||
		(entry.unconfirmed_dependencies?.length ?? 0) > 0
	) {
		const state = dependencyState(entry);
		signals.push({
			id: "dependencies",
			state,
			detail: [
				`dependencies ${state}`,
				listDetail("blocked", entry.blocked_by),
				listDetail("degraded", entry.degraded_by),
				listDetail("unconfirmed", entry.unconfirmed_dependencies),
			].filter(Boolean).join(" · "),
		});
	}

	if (
		entry.tunnel_status != null ||
		entry.tunnel_name != null ||
		entry.cloudflare_status_confirmed !== undefined
	) {
		const state = cloudflareState(entry);
		signals.push({
			id: "cloudflare",
			state,
			detail: [
				`Cloudflare ${state}`,
				entry.tunnel_status ? `tunnel ${entry.tunnel_status}` : null,
				entry.cloudflare_status_confirmed === false ? "global status unconfirmed" : null,
				entry.cloudflare_warning ?? null,
			].filter(Boolean).join(" · "),
		});
	}

	if (entry.url.startsWith("https://") || entry.tls_trusted !== undefined) {
		const state: HomelabHealthState =
			entry.tls_trusted === true ? "ok" : entry.tls_trusted === false ? "fail" : "unknown";
		signals.push({
			id: "tls",
			state,
			detail: `TLS ${entry.tls_trusted === true ? "trusted" : entry.tls_trusted === false ? "untrusted" : "unconfirmed"}`,
		});
	}

	if (
		entry.probe_source !== undefined ||
		entry.probe_stale !== undefined ||
		entry.observation_stale !== undefined ||
		entry.timed_out !== undefined
	) {
		const state = probeState(entry);
		signals.push({
			id: "probe",
			state,
			detail: [
				`probe ${entry.probe_source ?? "unknown"}`,
				entry.probe_stale === true ? "stale" : null,
				typeof entry.probe_age_seconds === "number"
					? `${Math.round(entry.probe_age_seconds)}s old`
					: null,
				typeof entry.next_probe_in_seconds === "number"
					? `next ~${Math.round(entry.next_probe_in_seconds)}s`
					: null,
			].filter(Boolean).join(" · "),
		});
	}
	return signals;
}
