import {
	isRecord,
	nullableBoolean,
	optionalBoolean,
	optionalNumber,
	optionalString,
	parseCache,
} from "./homelabObservabilityParsing";
import type {
	DeepDiagnosticCategory,
	DeepDiagnosticCheckEvidence,
	DeepDiagnosticEvidence,
} from "./homelabObservabilityTypes";
import type { OperationalHealthState } from "./homelabOperationalEvidence";

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
	if (
		raw.stale === true ||
		raw.degraded === true ||
		raw.tls_trusted === false
	) {
		return "warn";
	}
	if (
		raw.skipped === true ||
		raw.reachable === null ||
		raw.reachable === undefined
	) {
		return "unknown";
	}
	if (raw.reachable === true) return "ok";
	if (raw.reachable === false) return REQUIRED_CHECKS.has(id) ? "fail" : "warn";
	return "unknown";
}

export function parseDeepDiagnostics(value: unknown): DeepDiagnosticEvidence {
	if (!isRecord(value)) return { checks: [] };
	const rawChecks = isRecord(value.checks) ? value.checks : {};
	const checks = Object.entries(rawChecks).flatMap(([id, checkValue]) => {
		if (!isRecord(checkValue)) return [];
		const displayLabel =
			optionalString(checkValue.display_label) ??
			optionalString(checkValue.name);
		const cache = parseCache(checkValue);
		return [
			{
				id,
				label: displayLabel ?? id,
				category: categoryFor(id),
				state: stateForCheck(id, checkValue),
				reachable: nullableBoolean(checkValue.reachable),
				skipped: checkValue.skipped === true,
				...(optionalString(checkValue.reason)
					? { reason: optionalString(checkValue.reason) }
					: {}),
				...(optionalString(checkValue.error)
					? { error: optionalString(checkValue.error) }
					: {}),
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
				...(checkValue.tls_trusted === null ||
				typeof checkValue.tls_trusted === "boolean"
					? { tlsTrusted: checkValue.tls_trusted as boolean | null }
					: {}),
				...(optionalString(checkValue.probe)
					? { probe: optionalString(checkValue.probe) }
					: {}),
				...(optionalString(checkValue.authentication)
					? { authentication: optionalString(checkValue.authentication) }
					: {}),
				...(optionalString(checkValue.resource)
					? { resource: optionalString(checkValue.resource) }
					: {}),
				...(optionalString(checkValue.path)
					? { path: optionalString(checkValue.path) }
					: {}),
				...(optionalString(checkValue.target)
					? { target: optionalString(checkValue.target) }
					: {}),
				...(optionalBoolean(checkValue.degraded) !== undefined
					? { degraded: optionalBoolean(checkValue.degraded) }
					: {}),
				...(cache ? { cache } : {}),
			} satisfies DeepDiagnosticCheckEvidence,
		];
	});

	return {
		...(optionalString(value.contract)
			? { contract: optionalString(value.contract) }
			: {}),
		...(optionalString(value.status)
			? { status: optionalString(value.status) }
			: {}),
		...(optionalString(value.version)
			? { version: optionalString(value.version) }
			: {}),
		checks,
	};
}
