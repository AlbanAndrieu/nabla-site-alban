import type {
	HomelabDependencyEvidence,
	HomelabHealthEntry,
	HomelabHealthState,
} from "./homelabHealth";

export type DependencyRelationHealth =
	| "healthy"
	| "blocked"
	| "degraded"
	| "unconfirmed";

export type ResolvedHomelabHealth = {
	localState: HomelabHealthState;
	dependencyState: HomelabHealthState | null;
	effectiveState: HomelabHealthState;
	requiredDependencies: string[];
	blockedBy: string[];
	degradedBy: string[];
	unconfirmedDependencies: string[];
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
		degradedBy: entry?.degraded_by ?? [],
		unconfirmedDependencies: entry?.unconfirmed_dependencies ?? [],
		dependencyEvidence: entry?.dependency_evidence ?? [],
	};
}

function dependencyLabels(
	entry: HomelabHealthEntry | undefined,
	serviceIds: readonly string[],
): string[] {
	const names = new Map(
		(entry?.dependency_evidence ?? []).map((evidence) => [
			evidence.target,
			evidence.target_name?.trim() || evidence.target,
		]),
	);
	return serviceIds.map((serviceId) => names.get(serviceId) ?? serviceId);
}

export function blockedDependencyLabels(entry?: HomelabHealthEntry): string[] {
	return dependencyLabels(entry, entry?.blocked_by ?? []);
}

export function degradedDependencyLabels(entry?: HomelabHealthEntry): string[] {
	return dependencyLabels(entry, entry?.degraded_by ?? []);
}

export function unconfirmedDependencyLabels(
	entry?: HomelabHealthEntry,
): string[] {
	return dependencyLabels(entry, entry?.unconfirmed_dependencies ?? []);
}

function evidenceForRequiredDependency(
	entry: HomelabHealthEntry | undefined,
	target: string,
	relationType?: string,
): HomelabDependencyEvidence | undefined {
	return entry?.dependency_evidence?.find(
		(item) =>
			item.target === target &&
			(relationType === undefined || item.relation_type === relationType),
	);
}

export function requiredDependencyRelationHealth(
	entry: HomelabHealthEntry | undefined,
	target: string,
	relationType?: string,
): DependencyRelationHealth {
	if (entry?.blocked_by?.includes(target)) return "blocked";
	if (entry?.degraded_by?.includes(target)) return "degraded";
	if (entry?.unconfirmed_dependencies?.includes(target)) return "unconfirmed";

	const evidence = evidenceForRequiredDependency(entry, target, relationType);
	const state = evidence?.target_effective_state ?? evidence?.target_state;
	if (state === "fail") return "blocked";
	if (state === "warn") return "degraded";
	if (state === "unknown") return "unconfirmed";
	if (state === "ok") return "healthy";

	// A declared required edge without consumer-side observation is not healthy evidence.
	// Keep Declared != Observed != Healthy explicit until FastAPI confirms the target.
	return "unconfirmed";
}

export function requiredDependencyTargetState(
	entry: HomelabHealthEntry | undefined,
	target: string,
	relationType?: string,
): HomelabHealthState | null {
	const evidence = evidenceForRequiredDependency(entry, target, relationType);
	return evidence?.target_effective_state ?? evidence?.target_state ?? null;
}
