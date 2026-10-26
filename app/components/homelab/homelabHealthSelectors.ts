/** Pure SERVICE/OWNER health selection. No network or browser storage access. */
import type {
  HomelabHealthEntry,
  HomelabHealthSnapshot,
  HomelabHealthState,
} from "@/lib/homelabHealth";
import {
  canonicalHomelabEvidence,
  uniqueHomelabEvidenceIndex,
} from "@/lib/homelabHealthIdentity";
import { resolveEffectiveServiceState } from "@/lib/homelabHealthResolver";
import { homelabServiceId, type HomelabService } from "@/lib/homelabServices";
import { siteHealthIndex, type SiteHealthV2 } from "@/lib/siteHealthV2";

export type HomelabHealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
	ambiguousIds: Set<string>;
	byRef: Map<string, HomelabHealthState>;
};

export function healthIndex(
	snapshot: HomelabHealthSnapshot | null,
	siteHealth?: SiteHealthV2 | null,
	catalogRevision?: unknown,
): HomelabHealthIndex {
	const index = uniqueHomelabEvidenceIndex(snapshot?.services ?? []);
	return {
		byId: index.byId,
		byName: index.byName,
		ambiguousIds: index.ambiguousIds,
		byRef: siteHealthIndex(siteHealth, catalogRevision),
	};
}

export function effectiveState(
	service: HomelabService,
	index: HomelabHealthIndex,
	healthUnavailable = false,
): HomelabHealthState {
	const serviceId = homelabServiceId(service);
	const entry = canonicalHomelabEvidence(index, serviceId);
	if (entry && !healthUnavailable) {
		return resolveEffectiveServiceState(entry).effectiveState;
	}
	if (typeof service.entityRef === "string") {
		const state = index.byRef.get(service.entityRef);
		if (state) return state;
	}
	return "unknown";
}

export function countHealthStates(
	services: readonly HomelabService[],
	index: HomelabHealthIndex,
	healthUnavailable: boolean,
): Record<HomelabHealthState, number> {
	const counts: Record<HomelabHealthState, number> = {
		ok: 0,
		warn: 0,
		fail: 0,
		unknown: 0,
	};
	for (const service of services)
		counts[effectiveState(service, index, healthUnavailable)] += 1;
	return counts;
}

