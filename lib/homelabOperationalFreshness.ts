import type { FastApiHealthBoardSnapshot } from "./fastApiHealthBoard";
import {
	isRecord,
	optionalNumber,
	optionalString,
	stringArray,
} from "./homelabOperationalEvidenceParsing";
import type {
	DependencyCycleEvidence,
	OperationalComponentEvidence,
	PfSensePostureEvidence,
	StaleServiceEvidence,
	TroubleshootingFocus,
} from "./homelabOperationalEvidence";

export function parseFreshnessEvidence(homelab: Record<string, unknown>): {
	staleServices: StaleServiceEvidence[];
	dependencyCycles: DependencyCycleEvidence[];
} {
	const services = Array.isArray(homelab.services) ? homelab.services : [];
	const idToName = new Map<string, string>();
	for (const value of services) {
		if (!isRecord(value)) continue;
		const id = optionalString(value.id);
		const name = optionalString(value.name);
		if (id && name) idToName.set(id, name);
	}
	const staleServices = services.flatMap((value) => {
		if (!isRecord(value) || value.observation_stale !== true) return [];
		const id = optionalString(value.id) ?? optionalString(value.name) ?? "unknown";
		const name = optionalString(value.name) ?? id;
		return [
			{
				id,
				name,
				...(optionalNumber(value.observation_age_seconds) !== undefined
					? {
							observationAgeSeconds: optionalNumber(
								value.observation_age_seconds,
							),
						}
					: {}),
			},
		];
	});

	const cycleKeys = new Set<string>();
	const dependencyCycles: DependencyCycleEvidence[] = [];
	for (const value of services) {
		if (!isRecord(value)) continue;
		const members = stringArray(value.dependency_cycle).sort();
		if (members.length < 2) continue;
		const key = members.join("\0");
		if (cycleKeys.has(key)) continue;
		cycleKeys.add(key);
		dependencyCycles.push({
			members: members.map((member) => idToName.get(member) ?? member),
		});
	}
	return { staleServices, dependencyCycles };
}

export function deriveTroubleshootingFocus(
	components: OperationalComponentEvidence[],
	pfsense: PfSensePostureEvidence | null,
	staleServices: StaleServiceEvidence[],
	cycles: DependencyCycleEvidence[],
	board: FastApiHealthBoardSnapshot,
): TroubleshootingFocus {
	if (pfsense?.ingressBlock?.state === "blocked") return "pfsense_block";
	if (
		pfsense?.ingressBlock?.state === "telemetry_unavailable" &&
		pfsense.ingressBlock.controlPath?.blindSpot
	) {
		return "pfsense_blind_spot";
	}
	const byId = new Map(components.map((component) => [component.id, component]));
	if (byId.get("pfsense")?.state === "fail") return "pfsense_control";
	if (byId.get("cloudflare")?.state === "fail") return "cloudflare";
	if (byId.get("truenas")?.state === "fail") return "truenas";
	if (board.state === "stale" || staleServices.length > 0) return "stale_evidence";
	if (cycles.length > 0) return "dependency_cycle";
	return "dependencies";
}
