import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import { canonicalHomelabEvidence, uniqueHomelabEvidenceIndex, type UniqueHomelabEvidenceIndex } from "@/lib/homelabHealthIdentity";
import { reconcileHomelabHealth } from "@/lib/homelabHealthReconciliation";
import { type HomelabService, homelabServiceId } from "@/lib/homelabServices";

type HealthIndex = UniqueHomelabEvidenceIndex<HomelabHealthEntry>;

type RuntimePresentationState = HomelabHealthState | "missing";
type EffectiveHealthLabelKey =
	| "health.states.ok"
	| "health.states.warn"
	| "health.states.fail"
	| "health.states.unknown";

export const EFFECTIVE_HEALTH_LABEL_KEY: Record<
	HomelabHealthState,
	EffectiveHealthLabelKey
> = {
	ok: "health.states.ok",
	warn: "health.states.warn",
	fail: "health.states.fail",
	unknown: "health.states.unknown",
};

export const EFFECTIVE_HEALTH_ICON_CLASS: Record<HomelabHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

export const INTERNAL_HEALTH_CLASS: Record<HomelabHealthState, string> = {
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

/** Endpoint links add a browser-probe "pending" state to the shared health button classes. */
export type EndpointHealthState = HomelabHealthState | "pending";

export const ENDPOINT_HEALTH_CLASS: Record<EndpointHealthState, string> = {
	pending: "btn-outline-primary",
	...INTERNAL_HEALTH_CLASS,
};

export const RUNTIME_ICON_CLASS: Record<RuntimePresentationState, string> = {
	...EFFECTIVE_HEALTH_ICON_CLASS,
	missing: "fas fa-skull-crossbones",
};

export function serviceIconPath(iconSrc?: string): string {
	const candidate = iconSrc?.replace(/^\/+/, "");
	return candidate && /^assets\/selfh-icons\/[a-zA-Z0-9._-]+\.(?:png|jpg|svg)$/.test(candidate)
		? `/${candidate}`
		: "/assets/selfh-icons/generic-app.svg";
}

export function endpointUrlHostIsPrivateS3(value?: string): boolean {
	try {
		return new URL(value ?? "").hostname === "s3.int.albandrieu.com";
	} catch {
		return false;
	}
}

export function healthIndex(snapshot: HomelabHealthSnapshot | null): HealthIndex {
  return uniqueHomelabEvidenceIndex(snapshot?.services ?? []);
}

export function serviceHealthEvidence(
	index: HealthIndex,
	service: HomelabService,
	_url: string,
	snapshot: HomelabHealthSnapshot | null,
): HomelabHealthEntry | undefined {
	// URLs are accepted for call-site compatibility, never for matching probes.
	const generic = canonicalHomelabEvidence(index, homelabServiceId(service));
	if (homelabServiceId(service) !== "truenas" || !snapshot?.truenas?.public) {
		return generic;
	}

	const publicHealth = snapshot.truenas.public;
	return {
		...generic,
		...publicHealth,
		id: generic?.id ?? publicHealth.id ?? "truenas",
		name: generic?.name ?? publicHealth.name,
		url: publicHealth.url,
		// The clickable TrueNAS line represents only the direct public :7000
		// endpoint. Dependency/runtime health is deliberately kept out of this
		// navigation signal and remains visible through dedicated warnings.
		state: publicHealth.state,
		local_state: publicHealth.state,
		dependency_state: null,
		effective_state: publicHealth.state,
		required_dependencies: [],
		blocked_by: [],
		dependency_evidence: [],
		direct_state: publicHealth.state,
		internal_state:
			generic?.internal_state ?? snapshot.truenas.internal?.state ?? null,
	};
}

export function reconciledHealth(
	entry: HomelabHealthEntry | undefined,
	service: HomelabService,
	schemaVersion?: number,
): HomelabHealthEntry | undefined {
	if (!entry) return undefined;
	// Schema v4+ is already reconciled server-side from HTTP, TrueNAS runtime,
	// internal probes, Cloudflare and (from v5) required dependencies. Do not
	// apply a second browser policy that could contradict the authoritative state.
	if ((schemaVersion ?? 0) >= 4) return entry;

	const reconciliation = reconcileHomelabHealth(entry, {
		external: service.external === true,
		tunnelExpected: service.tunnelSecure === true,
	});
	return { ...entry, state: reconciliation.state };
}

function runtimeHealthState(state?: string | null): HomelabHealthState | null {
	const normalized = state?.trim().toUpperCase();
	if (!normalized) return null;
	if (["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"].includes(normalized)) {
		return "ok";
	}
	if (
		[
			"CRASHED",
			"DEPLOYING",
			"DOWN",
			"ERROR",
			"FAILED",
			"STOPPED",
			"STOPPING",
		].includes(normalized)
	) {
		return "fail";
	}
	return "warn";
}

export function internalPresentationState(
	entry: HomelabHealthEntry | undefined,
	runtimeStale: boolean,
): HomelabHealthState {
	return (
		entry?.internal_state ??
		(runtimeStale ? null : runtimeHealthState(entry?.runtime_state)) ??
		entry?.local_state ??
		entry?.state ??
		"unknown"
	);
}

export function runtimePresentationState(
	entry: HomelabHealthEntry | undefined,
	dependsOnTrueNas: boolean,
	serviceId: string,
	runtimeUnavailable: boolean,
	runtimeStale: boolean,
): RuntimePresentationState | null {
	if (!dependsOnTrueNas || serviceId === "truenas") return null;
	if (
		runtimeUnavailable ||
		runtimeStale ||
		entry?.runtime_stale === true ||
		entry?.observation_stale === true ||
		entry?.runtime_reachable === false
	) {
		return "unknown";
	}
	if (entry?.runtime_missing === true) return "missing";
	return runtimeHealthState(entry?.runtime_state) ?? "unknown";
}
