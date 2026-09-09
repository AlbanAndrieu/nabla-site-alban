import type {
	HomelabDependencyEvidence,
	HomelabHealthEntry,
	HomelabHealthState,
} from "./homelabHealth";

export type ResolvedHomelabHealth = {
	localState: HomelabHealthState;
	dependencyState: HomelabHealthState | null;
	effectiveState: HomelabHealthState;
	requiredDependencies: string[];
	blockedBy: string[];
	dependencyEvidence: HomelabDependencyEvidence[];
};

export function hasFreshRuntimeInventoryConflict(
	entry?: HomelabHealthEntry,
): boolean {
	if (
		!entry ||
		entry.runtime_missing !== true ||
		entry.runtime_stale === true ||
		entry.observation_stale === true
	) {
		return false;
	}
	const publicOriginOk =
		entry.direct_state === "ok" ||
		(entry.reachable === true &&
			entry.http_status >= 200 &&
			entry.http_status < 300);
	return publicOriginOk || entry.internal_state === "ok";
}

export function resolveEffectiveServiceState(
	entry?: HomelabHealthEntry,
): ResolvedHomelabHealth {
	const fallback = entry?.state ?? "unknown";
	const serverEffectiveState = entry?.effective_state ?? fallback;
	const effectiveState =
		serverEffectiveState === "fail" && hasFreshRuntimeInventoryConflict(entry)
			? "warn"
			: serverEffectiveState;
	return {
		localState: entry?.local_state ?? fallback,
		dependencyState: entry?.dependency_state ?? null,
		effectiveState,
		requiredDependencies: entry?.required_dependencies ?? [],
		blockedBy: entry?.blocked_by ?? [],
		dependencyEvidence: entry?.dependency_evidence ?? [],
	};
}

export function blockedDependencyLabels(entry?: HomelabHealthEntry): string[] {
	const resolved = resolveEffectiveServiceState(entry);
	const names = new Map(
		resolved.dependencyEvidence.map((evidence) => [
			evidence.target,
			evidence.target_name?.trim() || evidence.target,
		]),
	);
	return resolved.blockedBy.map((serviceId) => names.get(serviceId) ?? serviceId);
}

export function requiredDependencyTargetState(
	entry: HomelabHealthEntry | undefined,
	target: string,
	relationType?: string,
): HomelabHealthState | null {
	const evidence = entry?.dependency_evidence?.find(
		(item) =>
			item.target === target &&
			(relationType === undefined || item.relation_type === relationType),
	);
	return evidence?.target_state ?? null;
}
