import type { HomelabHealthEntry, HomelabHealthState } from "./homelabHealth";
import type { ServiceTopology, ServiceTopologyRelation } from "./serviceTopology";

const HEALTH_RELATION_TYPES = new Set([
	"dependsOn",
	"consumesApi",
	"routesTo",
	"storesIn",
	"authenticatesVia",
	"exposedBy",
]);

export type ServiceImpact = {
	id: string;
	name: string;
	distance: number;
	path: string[];
};

export type HealthCauseCode =
	| "application_error"
	| "local_failure"
	| "dependency_failure"
	| "dependency_unknown"
	| "stale_observation"
	| "runtime_degraded"
	| "healthy"
	| "unknown";

export type HealthCause = {
	code: HealthCauseCode;
	state: HomelabHealthState;
	targets?: string[];
	detail?: string;
};

function requiredHealthRelations(topology: ServiceTopology): ServiceTopologyRelation[] {
	return topology.relations.filter(
		(relation) =>
			relation.strength === "required" && HEALTH_RELATION_TYPES.has(relation.type),
	);
}

export function affectedDependents(
	topology: ServiceTopology,
	serviceId: string,
): ServiceImpact[] {
	const names = new Map(topology.nodes.map((node) => [node.id, node.name]));
	const reverse = new Map<string, string[]>();
	for (const relation of requiredHealthRelations(topology)) {
		const dependents = reverse.get(relation.target) ?? [];
		dependents.push(relation.source);
		reverse.set(relation.target, dependents);
	}

	const seen = new Set([serviceId]);
	const queue: Array<{ id: string; distance: number; path: string[] }> = [
		{ id: serviceId, distance: 0, path: [serviceId] },
	];
	const result: ServiceImpact[] = [];
	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) break;
		for (const dependent of reverse.get(current.id) ?? []) {
			if (seen.has(dependent)) continue;
			seen.add(dependent);
			const path = [...current.path, dependent];
			const distance = current.distance + 1;
			result.push({
				id: dependent,
				name: names.get(dependent) ?? dependent,
				distance,
				path,
			});
			queue.push({ id: dependent, distance, path });
		}
	}
	return result.sort(
		(a, b) => a.distance - b.distance || a.name.localeCompare(b.name),
	);
}

function stateRank(state: HomelabHealthState | undefined): number {
	switch (state) {
		case "fail":
			return 4;
		case "warn":
			return 3;
		case "unknown":
			return 2;
		case "ok":
			return 1;
		default:
			return 0;
	}
}

export function incidentDependencyPath(
	start: HomelabHealthEntry,
	entries: HomelabHealthEntry[],
): string[] {
	const byId = new Map(
		entries.flatMap((entry) => (entry.id ? [[entry.id, entry] as const] : [])),
	);
	const path: string[] = [start.id ?? start.name];
	let current = start;
	const seen = new Set(path);
	for (let depth = 0; depth < 12; depth += 1) {
		const candidates = (current.blocked_by ?? [])
			.map((id) => byId.get(id))
			.filter((entry): entry is HomelabHealthEntry => Boolean(entry))
			.sort((a, b) => {
				const staleDelta = Number(b.observation_stale) - Number(a.observation_stale);
				return staleDelta || stateRank(b.effective_state ?? b.state) - stateRank(a.effective_state ?? a.state);
			});
		const next = candidates[0];
		if (!next) break;
		const nextId = next.id ?? next.name;
		if (seen.has(nextId)) {
			path.push(nextId);
			break;
		}
		seen.add(nextId);
		path.push(nextId);
		current = next;
	}
	return path;
}

export function explainHealth(entry?: HomelabHealthEntry): HealthCause[] {
	if (!entry) return [{ code: "unknown", state: "unknown" }];
	const causes: HealthCause[] = [];
	const local = entry.local_state ?? entry.state;
	const effective = entry.effective_state ?? entry.state;
	if (entry.application_error) {
		causes.push({
			code: "application_error",
			state: "fail",
			detail: entry.application_error,
		});
	}
	if (local === "fail" && !entry.application_error) {
		causes.push({ code: "local_failure", state: "fail", detail: entry.error });
	}
	if ((entry.blocked_by?.length ?? 0) > 0) {
		const targetStates = entry.dependency_evidence ?? [];
		const hasFailure = targetStates.some((item) => item.target_state === "fail");
		causes.push({
			code: hasFailure ? "dependency_failure" : "dependency_unknown",
			state: "warn",
			targets: entry.blocked_by,
		});
	}
	if (entry.observation_stale) {
		causes.push({ code: "stale_observation", state: "unknown" });
	}
	if (
		entry.runtime_state &&
		!["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"].includes(
			entry.runtime_state.toUpperCase(),
		)
	) {
		causes.push({
			code: "runtime_degraded",
			state: effective === "fail" ? "fail" : "warn",
			detail: entry.runtime_state,
		});
	}
	if (causes.length === 0 && effective === "ok") {
		causes.push({ code: "healthy", state: "ok" });
	}
	if (causes.length === 0) causes.push({ code: "unknown", state: effective });
	return causes;
}
