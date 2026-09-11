import {
	healthState,
	isRecord,
	optionalBoolean,
	optionalNumber,
	optionalString,
	stringArray,
} from "./homelabOperationalEvidenceParsing";
import type {
	OperationalComponentEvidence,
	OperationalHealthState,
} from "./homelabOperationalEvidenceTypes";

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

export function parseOperationalComponents(
	homelab: Record<string, unknown>,
): OperationalComponentEvidence[] {
	const rawComponents = isRecord(homelab.components) ? homelab.components : {};
	return (["truenas", "pfsense", "cloudflare"] as const).map((id) =>
		parseComponentEvidence(id, rawComponents[id]),
	);
}
