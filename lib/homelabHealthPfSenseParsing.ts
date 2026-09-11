import type {
	PfSenseDnsPosture,
	PfSenseDnsResolverPosture,
	PfSenseDnsUpstreamPosture,
	PfSenseIngressBlockObservation,
	PfSenseIngressControlPath,
	PfSenseIngressEndpoint,
	PfSenseSecurityFilterObservation,
} from "./homelabHealthTypes";
import {
	isHealthState,
	isRecord,
	validOptionalBoolean,
	validOptionalString,
} from "./homelabHealthValidation";

function parseSecurityFilters(
	value: unknown,
): PfSenseSecurityFilterObservation[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const filters = value.flatMap((item) => {
		if (
			!isRecord(item) ||
			typeof item.id !== "string" ||
			typeof item.label !== "string" ||
			typeof item.state !== "string" ||
			typeof item.detail !== "string"
		) {
			return [];
		}
		return [
			{
				id: item.id,
				label: item.label,
				state: item.state,
				detail: item.detail,
			},
		];
	});
	return filters.length > 0 ? filters : undefined;
}

function parseIngressEndpoint(
	value: unknown,
): PfSenseIngressEndpoint | undefined {
	if (!isRecord(value)) return undefined;
	if (
		!validOptionalString(value.ip) ||
		(value.port !== undefined &&
			(typeof value.port !== "number" ||
				!Number.isInteger(value.port) ||
				value.port < 1 ||
				value.port > 65535)) ||
		!validOptionalString(value.role)
	) {
		return undefined;
	}
	return {
		...(value.ip === null || typeof value.ip === "string"
			? { ip: value.ip }
			: {}),
		...(typeof value.port === "number" ? { port: value.port } : {}),
		...(typeof value.role === "string" ? { role: value.role } : {}),
	};
}

function parseIngressBlock(
	value: unknown,
): PfSenseIngressBlockObservation | undefined {
	if (!isRecord(value)) return undefined;
	if (
		typeof value.state !== "string" ||
		typeof value.telemetry_available !== "boolean" ||
		typeof value.attribution_available !== "boolean" ||
		typeof value.evidence !== "string"
	) {
		return undefined;
	}
	let controlPath: PfSenseIngressControlPath | undefined;
	if (
		isRecord(value.control_path) &&
		typeof value.control_path.mode === "string" &&
		typeof value.control_path.independent_from_wan_filter === "boolean" &&
		typeof value.control_path.blind_spot === "boolean" &&
		typeof value.control_path.detail === "string"
	) {
		controlPath = {
			mode: value.control_path.mode,
			independent_from_wan_filter:
				value.control_path.independent_from_wan_filter,
			blind_spot: value.control_path.blind_spot,
			detail: value.control_path.detail,
		};
	}
	const source = parseIngressEndpoint(value.source);
	const destination = parseIngressEndpoint(value.destination);
	return {
		state: value.state,
		telemetry_available: value.telemetry_available,
		attribution_available: value.attribution_available,
		evidence: value.evidence,
		...(typeof value.engine === "string" ? { engine: value.engine } : {}),
		...(typeof value.firewall === "string" ? { firewall: value.firewall } : {}),
		...(typeof value.mechanism === "string"
			? { mechanism: value.mechanism }
			: {}),
		...(source ? { source } : {}),
		...(destination ? { destination } : {}),
		...(typeof value.table_entry_count === "number" &&
		Number.isInteger(value.table_entry_count) &&
		value.table_entry_count >= 0
			? { table_entry_count: value.table_entry_count }
			: {}),
		...(controlPath ? { control_path: controlPath } : {}),
	};
}

export function parsePfSenseDnsPosture(
	value: unknown,
): PfSenseDnsPosture | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.configured !== "boolean" ||
		(value.reachable !== null && typeof value.reachable !== "boolean") ||
		!isHealthState(value.policy_state) ||
		typeof value.reason !== "string" ||
		value.reason.trim().length === 0 ||
		!validOptionalString(value.error_stage) ||
		!validOptionalString(value.error)
	) {
		return null;
	}

	let resolver: PfSenseDnsResolverPosture | undefined;
	if (value.resolver !== undefined) {
		if (!isRecord(value.resolver)) return null;
		const raw = value.resolver;
		if (
			!validOptionalBoolean(raw.enabled) ||
			!validOptionalBoolean(raw.running) ||
			!validOptionalBoolean(raw.forwarding) ||
			!validOptionalBoolean(raw.forward_tls_upstream) ||
			(raw.port !== undefined &&
				raw.port !== null &&
				(typeof raw.port !== "number" ||
					!Number.isInteger(raw.port) ||
					raw.port < 1 ||
					raw.port > 65535))
		) {
			return null;
		}
		resolver = {
			enabled: raw.enabled as boolean | null | undefined,
			running: raw.running as boolean | null | undefined,
			forwarding: raw.forwarding as boolean | null | undefined,
			forward_tls_upstream: raw.forward_tls_upstream as
				| boolean
				| null
				| undefined,
			port: raw.port as number | null | undefined,
		};
	}

	let upstream: PfSenseDnsUpstreamPosture | undefined;
	if (value.upstream !== undefined) {
		if (!isRecord(value.upstream)) return null;
		const raw = value.upstream;
		if (
			typeof raw.count !== "number" ||
			!Number.isInteger(raw.count) ||
			raw.count < 0 ||
			!validOptionalBoolean(raw.independent_from_truenas) ||
			!validOptionalBoolean(raw.truenas_only)
		) {
			return null;
		}
		upstream = {
			count: raw.count,
			independent_from_truenas: raw.independent_from_truenas as
				| boolean
				| null
				| undefined,
			truenas_only: raw.truenas_only as boolean | null | undefined,
		};
	}

	const securityFilters = parseSecurityFilters(value.security_filters);
	const ingressBlock = parseIngressBlock(value.ingress_block);
	return {
		configured: value.configured,
		reachable: value.reachable,
		policy_state: value.policy_state,
		reason: value.reason,
		...(resolver ? { resolver } : {}),
		...(upstream ? { upstream } : {}),
		...(securityFilters ? { security_filters: securityFilters } : {}),
		...(ingressBlock ? { ingress_block: ingressBlock } : {}),
		...(typeof value.error_stage === "string"
			? { error_stage: value.error_stage }
			: {}),
		...(typeof value.error === "string" ? { error: value.error } : {}),
	};
}
