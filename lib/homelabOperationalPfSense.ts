import {
	healthState,
	isRecord,
	optionalBoolean,
	optionalNumber,
	optionalString,
} from "./homelabOperationalEvidenceParsing";
import type {
	PfSenseIngressEvidence,
	PfSensePostureEvidence,
} from "./homelabOperationalEvidenceTypes";

function parseIngressBlock(value: unknown): PfSenseIngressEvidence | null {
	if (!isRecord(value)) return null;
	const control = isRecord(value.control_path) ? value.control_path : null;
	const source = isRecord(value.source) ? value.source : null;
	const destination = isRecord(value.destination) ? value.destination : null;
	return {
		state: optionalString(value.state) ?? "unknown",
		telemetryAvailable: optionalBoolean(value.telemetry_available),
		attributionAvailable: optionalBoolean(value.attribution_available),
		...(optionalString(value.engine) ? { engine: optionalString(value.engine) } : {}),
		...(optionalString(value.firewall) ? { firewall: optionalString(value.firewall) } : {}),
		...(optionalString(value.mechanism)
			? { mechanism: optionalString(value.mechanism) }
			: {}),
		...(optionalString(value.evidence)
			? { evidence: optionalString(value.evidence) }
			: {}),
		...(source
			? {
					sourceIp: source.ip === null ? null : optionalString(source.ip) ?? null,
				}
			: {}),
		...(destination
			? {
					destinationIp:
						destination.ip === null
							? null
							: optionalString(destination.ip) ?? null,
					...(optionalNumber(destination.port) !== undefined
						? { destinationPort: optionalNumber(destination.port) }
						: {}),
				}
			: {}),
		...(control
			? {
					controlPath: {
						...(optionalString(control.mode)
							? { mode: optionalString(control.mode) }
							: {}),
						independentFromWanFilter: optionalBoolean(
							control.independent_from_wan_filter,
						),
						blindSpot: control.blind_spot === true,
						...(optionalString(control.detail)
							? { detail: optionalString(control.detail) }
							: {}),
					},
				}
			: {}),
	};
}

export function parsePfSensePosture(
	homelab: Record<string, unknown>,
): PfSensePostureEvidence | null {
	const pfsense = isRecord(homelab.pfsense) ? homelab.pfsense : null;
	const dns = pfsense && isRecord(pfsense.dns) ? pfsense.dns : null;
	if (!dns) return null;
	const securityFilters = Array.isArray(dns.security_filters)
		? dns.security_filters.flatMap((value) => {
				if (!isRecord(value)) return [];
				const id = optionalString(value.id);
				const label = optionalString(value.label);
				const state = optionalString(value.state);
				const detail = optionalString(value.detail);
				return id && label && state && detail ? [{ id, label, state, detail }] : [];
			})
		: [];
	return {
		configured: optionalBoolean(dns.configured),
		reachable: optionalBoolean(dns.reachable),
		policyState: healthState(dns.policy_state) ?? "unknown",
		...(optionalString(dns.reason) ? { reason: optionalString(dns.reason) } : {}),
		...(optionalString(dns.error_stage)
			? { errorStage: optionalString(dns.error_stage) }
			: {}),
		...(optionalString(dns.error) ? { error: optionalString(dns.error) } : {}),
		securityFilters,
		ingressBlock: parseIngressBlock(dns.ingress_block),
	};
}
