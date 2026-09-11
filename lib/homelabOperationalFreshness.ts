import {
	isRecord,
	optionalNumber,
	optionalString,
	stringArray,
} from "./homelabOperationalEvidenceShared";
import type {
	DependencyCycleEvidence,
	StaleServiceEvidence,
} from "./homelabOperationalEvidenceTypes";

export function parseOperationalFreshness(homelab: Record<string, unknown>): {
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
					? { observationAgeSeconds: optionalNumber(value.observation_age_seconds) }
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
