import {
	isRecord,
	optionalBoolean,
	optionalString,
	stringArray,
} from "./homelabOperationalEvidenceParsing";
import type {
	ExposurePortEvidence,
	OperationalHealthState,
} from "./homelabOperationalEvidenceTypes";

function exposureState(
	observed: boolean | null,
	expected: boolean | null,
	trustedSourcesOnly: boolean,
): OperationalHealthState {
	if (observed === null || expected === null) return "unknown";
	if (observed !== expected) return "fail";
	return trustedSourcesOnly ? "warn" : "ok";
}

export function parseExposurePorts(sickzValue: unknown): ExposurePortEvidence[] {
	if (!isRecord(sickzValue) || !isRecord(sickzValue.checks)) return [];
	const pfsense = Object.values(sickzValue.checks).find(
		(value) => isRecord(value) && isRecord(value.pfsense_tcp_port_policy),
	);
	if (!isRecord(pfsense)) return [];
	const policyByPort = pfsense.pfsense_tcp_port_policy;
	if (!isRecord(policyByPort)) return [];
	const observedPorts = isRecord(pfsense.pfsense_tcp_ports)
		? pfsense.pfsense_tcp_ports
		: {};
	return [7000, 10443].flatMap((port) => {
		const policy = policyByPort[String(port)];
		if (!isRecord(policy)) return [];
		const observed = optionalBoolean(observedPorts[String(port)]);
		const expected = optionalBoolean(policy.expected_reachable);
		const accessPolicy = optionalString(policy.access_policy);
		return [
			{
				port,
				service: optionalString(policy.service) ?? `TCP ${port}`,
				observedReachable: observed,
				expectedReachable: expected,
				...(accessPolicy ? { accessPolicy } : {}),
				...(optionalString(policy.default_action)
					? { defaultAction: optionalString(policy.default_action) }
					: {}),
				expectedFrom: stringArray(policy.expected_from),
				negativeProbeRequired: policy.negative_probe_required === true,
				...(optionalString(policy.reason)
					? { reason: optionalString(policy.reason) }
					: {}),
				state: exposureState(
					observed,
					expected,
					accessPolicy === "trusted_sources_only",
				),
			},
		];
	});
}
